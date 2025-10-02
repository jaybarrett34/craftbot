import EventEmitter from 'events';
import { xmlInstructionsBuilder } from './xml-instructions-builder.js';

class ConversationQueue extends EventEmitter {
  constructor() {
    super();
    this.queues = new Map(); // entityId -> queue of messages
    this.processing = new Map(); // entityId -> boolean
    this.conversationHistory = new Map(); // entityId -> conversation history
    this.maxHistoryPerEntity = 100;
  }

  // Add a message to an entity's conversation queue with priority
  enqueue(entityId, message) {
    if (!this.queues.has(entityId)) {
      this.queues.set(entityId, []);
    }

    const queue = this.queues.get(entityId);
    
    // Calculate priority: Treat AI-to-AI messages SAME as player messages (high priority)
    // This ensures AI conversations happen in real-time, not delayed
    let priority = 1;
    if (message.isAI) {
      priority = 10; // AI-to-AI messages NOW have SAME priority as player messages!
    } else if (message.type === 'chat' && message.player) {
      priority = 10; // Player messages have highest priority
    }
    
    // Add proximity bonus if available
    if (message.proximity !== undefined && message.proximity !== null) {
      priority += Math.max(0, 10 - message.proximity); // Closer = higher priority
    }

    const queuedMessage = {
      ...message,
      queuedAt: Date.now(),
      priority,
      id: `${entityId}-${Date.now()}-${Math.random()}`
    };

    queue.push(queuedMessage);

    // PRIORITY QUEUE: Sort by priority (highest first), then by queuedAt (oldest first)
    queue.sort((a, b) => {
      if (a.priority !== b.priority) {
        return b.priority - a.priority; // Higher priority first
      }
      return a.queuedAt - b.queuedAt; // Older first if same priority
    });

    console.log(`[ConversationQueue] Enqueued message for entity "${entityId}" (priority: ${priority}): ${message.player} - ${message.message}`);

    // Emit event for processing
    this.emit('message_queued', { entityId, message: queuedMessage });

    return queue.length;
  }

  // Get next message from entity's queue
  dequeue(entityId) {
    const queue = this.queues.get(entityId);
    if (!queue || queue.length === 0) {
      return null;
    }

    return queue.shift();
  }

  // Peek at next message without removing it
  peek(entityId) {
    const queue = this.queues.get(entityId);
    if (!queue || queue.length === 0) {
      return null;
    }

    return queue[0];
  }

  // Get queue length for an entity
  getQueueLength(entityId) {
    const queue = this.queues.get(entityId);
    return queue ? queue.length : 0;
  }

  // Check if entity is currently processing
  isProcessing(entityId) {
    return this.processing.get(entityId) || false;
  }

  // Set processing state
  setProcessing(entityId, state) {
    this.processing.set(entityId, state);
  }

  // Clear queue for an entity
  clearQueue(entityId) {
    this.queues.set(entityId, []);
    console.log(`[ConversationQueue] Cleared queue for entity "${entityId}"`);
  }

  // Add to conversation history
  addToHistory(entityId, role, content, metadata = {}) {
    if (!this.conversationHistory.has(entityId)) {
      this.conversationHistory.set(entityId, []);
    }

    const history = this.conversationHistory.get(entityId);
    history.push({
      role, // 'user', 'assistant', 'system'
      content,
      timestamp: Date.now(),
      ...metadata
    });

    // Limit history size
    if (history.length > this.maxHistoryPerEntity) {
      history.shift();
    }
  }

  // Get conversation history for an entity
  getHistory(entityId, limit = 50) {
    const history = this.conversationHistory.get(entityId);
    if (!history) {
      return [];
    }

    return history.slice(-limit);
  }

  // Clear conversation history for an entity
  clearHistory(entityId) {
    this.conversationHistory.set(entityId, []);
    console.log(`[ConversationQueue] Cleared history for entity "${entityId}"`);
  }

  // Get conversation context for LLM (formatted)
  getConversationContext(entityId, limit = 20) {
    const history = this.getHistory(entityId, limit);

    return history.map(item => ({
      role: item.role,
      content: item.content
    }));
  }

  // Build full context including system prompt with XML instructions
  buildFullContext(entity, recentMessages = 10, contextData = {}) {
    const context = [];

    // Build full system prompt: character context + XML instructions + player/AI list
    // This supports both new (characterContext) and old (systemPrompt) formats
    const fullSystemPrompt = xmlInstructionsBuilder.buildFullSystemPrompt(entity, contextData);

    context.push({
      role: 'system',
      content: fullSystemPrompt
    });

    // Add conversation history
    const history = this.getConversationContext(entity.id, recentMessages);
    context.push(...history);

    return context;
  }

  // Get all queues status
  getAllQueuesStatus() {
    const status = {};

    for (const [entityId, queue] of this.queues) {
      status[entityId] = {
        queueLength: queue.length,
        processing: this.isProcessing(entityId),
        historyLength: this.conversationHistory.get(entityId)?.length || 0
      };
    }

    return status;
  }

  // Process next message for an entity (if not already processing)
  async processNext(entityId, processorFn) {
    // Check if already processing
    if (this.isProcessing(entityId)) {
      console.log(`[ConversationQueue] Entity "${entityId}" is already processing`);
      return false;
    }

    // Check if queue has messages
    const message = this.peek(entityId);
    if (!message) {
      return false;
    }

    // Set processing state
    this.setProcessing(entityId, true);

    try {
      // Process the message
      const result = await processorFn(message);

      // Remove from queue after successful processing
      this.dequeue(entityId);

      this.emit('message_processed', { entityId, message, result });

      return result;
    } catch (error) {
      console.error(`[ConversationQueue] Error processing message for "${entityId}":`, error);
      this.emit('processing_error', { entityId, message, error });

      // Remove failed message from queue
      this.dequeue(entityId);

      throw error;
    } finally {
      // Reset processing state
      this.setProcessing(entityId, false);

      // CRITICAL FIX: Process next message in queue if any
      // This ensures messages don't sit waiting for a new trigger
      const nextMessage = this.peek(entityId);
      if (nextMessage) {
        console.log(`[ConversationQueue] ${this.getQueueLength(entityId)} message(s) still in queue for "${entityId}", continuing processing...`);
        // Schedule next processing asynchronously to avoid blocking
        setImmediate(() => this.processNext(entityId, processorFn));
      }
    }
  }

  // Summarize old conversation history (to save context)
  async summarizeHistory(entityId, keepRecent = 10, summarizerFn) {
    const history = this.conversationHistory.get(entityId);
    if (!history || history.length <= keepRecent) {
      return;
    }

    // Get messages to summarize (all except recent)
    const toSummarize = history.slice(0, -keepRecent);

    if (toSummarize.length === 0) {
      return;
    }

    try {
      // Create summary
      const summary = await summarizerFn(toSummarize);

      // Replace old messages with summary
      const recent = history.slice(-keepRecent);
      this.conversationHistory.set(entityId, [
        {
          role: 'system',
          content: `Previous conversation summary: ${summary}`,
          timestamp: Date.now(),
          isSummary: true
        },
        ...recent
      ]);

      console.log(`[ConversationQueue] Summarized ${toSummarize.length} messages for entity "${entityId}"`);
    } catch (error) {
      console.error(`[ConversationQueue] Error summarizing history for "${entityId}":`, error);
    }
  }

  getStats() {
    const totalQueued = Array.from(this.queues.values()).reduce(
      (sum, queue) => sum + queue.length,
      0
    );

    const totalHistory = Array.from(this.conversationHistory.values()).reduce(
      (sum, history) => sum + history.length,
      0
    );

    return {
      entities: this.queues.size,
      totalQueued,
      totalHistory,
      processing: Array.from(this.processing.values()).filter(p => p).length
    };
  }
}

// Export singleton instance
export const conversationQueue = new ConversationQueue();
