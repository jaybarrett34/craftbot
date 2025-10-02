/**
 * Conversation Queue Manager
 *
 * Manages incoming messages and NPC response queue with priority handling:
 * - Player messages have higher priority than NPC-to-NPC
 * - Batches multiple messages for context-aware responses
 * - Handles timeouts for slow LLM responses
 * - Tracks conversation history per NPC
 */

class ConversationQueue {
  constructor(options = {}) {
    this.queues = new Map(); // entityId -> queue
    this.processing = new Map(); // entityId -> boolean
    this.history = new Map(); // entityId -> conversation history
    this.config = {
      maxQueueSize: options.maxQueueSize || 50,
      batchDelay: options.batchDelay || 500, // ms to wait before batching
      responseTimeout: options.responseTimeout || 30000, // 30s timeout
      maxHistorySize: options.maxHistorySize || 100,
      priorityWeights: {
        player: 10,
        npc: 5,
        system: 1
      },
      ...options
    };
    this.batchTimers = new Map(); // entityId -> timer
  }

  /**
   * Add message to NPC's queue
   * @param {string} entityId - NPC entity ID
   * @param {Object} message - Message object
   * @returns {boolean} Success status
   */
  enqueue(entityId, message) {
    if (!this.queues.has(entityId)) {
      this.queues.set(entityId, []);
    }

    const queue = this.queues.get(entityId);

    // Validate message structure
    const validatedMessage = this.validateMessage(message);
    if (!validatedMessage) {
      console.error('Invalid message format:', message);
      return false;
    }

    // Check queue size limit
    if (queue.length >= this.config.maxQueueSize) {
      console.warn(`Queue full for ${entityId}, dropping oldest message`);
      queue.shift();
    }

    // Add timestamp and priority
    validatedMessage.queuedAt = Date.now();
    validatedMessage.priority = this.calculatePriority(validatedMessage);

    queue.push(validatedMessage);

    // Sort queue by priority (higher first)
    queue.sort((a, b) => b.priority - a.priority);

    // Schedule batch processing
    this.scheduleBatchProcessing(entityId);

    return true;
  }

  /**
   * Validate and normalize message structure
   * @param {Object} message - Raw message
   * @returns {Object|null} Validated message or null
   */
  validateMessage(message) {
    if (!message || typeof message !== 'object') {
      return null;
    }

    return {
      type: message.type || 'chat', // chat, proximity, system, npc
      sender: message.sender || 'unknown',
      content: message.content || '',
      metadata: {
        proximity: message.proximity || null, // blocks distance
        timestamp: message.timestamp || new Date().toISOString(),
        isPlayer: message.isPlayer !== undefined ? message.isPlayer : true,
        ...message.metadata
      }
    };
  }

  /**
   * Calculate message priority
   * @param {Object} message - Validated message
   * @returns {number} Priority score
   */
  calculatePriority(message) {
    let priority = 0;

    // Base priority by sender type
    if (message.metadata.isPlayer) {
      priority += this.config.priorityWeights.player;
    } else if (message.type === 'npc') {
      priority += this.config.priorityWeights.npc;
    } else {
      priority += this.config.priorityWeights.system;
    }

    // Proximity bonus (closer = higher priority)
    if (message.metadata.proximity !== null && message.metadata.proximity !== undefined) {
      const proximityBonus = Math.max(0, 10 - message.metadata.proximity);
      priority += proximityBonus;
    }

    // Age penalty (older messages get slight priority boost)
    const age = Date.now() - new Date(message.metadata.timestamp).getTime();
    priority += Math.min(5, age / 1000); // +1 per second, max +5

    return priority;
  }

  /**
   * Schedule batch processing with delay
   * @param {string} entityId - NPC entity ID
   */
  scheduleBatchProcessing(entityId) {
    // Clear existing timer
    if (this.batchTimers.has(entityId)) {
      clearTimeout(this.batchTimers.get(entityId));
    }

    // Set new timer
    const timer = setTimeout(() => {
      this.processBatch(entityId);
    }, this.config.batchDelay);

    this.batchTimers.set(entityId, timer);
  }

  /**
   * Process batched messages for an NPC
   * @param {string} entityId - NPC entity ID
   * @returns {Promise<Object>} Batched messages
   */
  async processBatch(entityId) {
    if (this.processing.get(entityId)) {
      // Already processing, will catch next batch
      return null;
    }

    const queue = this.queues.get(entityId);
    if (!queue || queue.length === 0) {
      return null;
    }

    this.processing.set(entityId, true);

    try {
      // Get all pending messages
      const messages = [...queue];
      queue.length = 0; // Clear queue

      // Batch messages by proximity and time
      const batch = this.batchMessages(messages);

      // Add to history
      this.addToHistory(entityId, batch);

      return batch;
    } finally {
      this.processing.set(entityId, false);
    }
  }

  /**
   * Batch messages intelligently
   * @param {Array<Object>} messages - Array of messages
   * @returns {Object} Batched message structure
   */
  batchMessages(messages) {
    const playerMessages = messages.filter(m => m.metadata.isPlayer);
    const npcMessages = messages.filter(m => !m.metadata.isPlayer);

    return {
      id: `batch_${Date.now()}`,
      timestamp: new Date().toISOString(),
      playerMessages: playerMessages.map(m => ({
        sender: m.sender,
        content: m.content,
        proximity: m.metadata.proximity
      })),
      npcMessages: npcMessages.map(m => ({
        sender: m.sender,
        content: m.content
      })),
      context: this.buildContext(messages),
      messageCount: messages.length
    };
  }

  /**
   * Build context from messages
   * @param {Array<Object>} messages - Array of messages
   * @returns {Object} Context object
   */
  buildContext(messages) {
    const senders = [...new Set(messages.map(m => m.sender))];
    const avgProximity = messages
      .filter(m => m.metadata.proximity !== null)
      .reduce((sum, m, _, arr) => sum + m.metadata.proximity / arr.length, 0);

    return {
      uniqueSenders: senders,
      senderCount: senders.length,
      avgProximity: avgProximity || null,
      hasPlayerMessages: messages.some(m => m.metadata.isPlayer)
    };
  }

  /**
   * Add batch to conversation history
   * @param {string} entityId - NPC entity ID
   * @param {Object} batch - Batched messages
   */
  addToHistory(entityId, batch) {
    if (!this.history.has(entityId)) {
      this.history.set(entityId, []);
    }

    const history = this.history.get(entityId);
    history.push({
      type: 'incoming',
      batch,
      timestamp: new Date().toISOString()
    });

    // Trim history if too long
    if (history.length > this.config.maxHistorySize) {
      history.splice(0, history.length - this.config.maxHistorySize);
    }
  }

  /**
   * Add NPC response to history
   * @param {string} entityId - NPC entity ID
   * @param {Object} response - Parsed LLM response
   */
  addResponseToHistory(entityId, response) {
    if (!this.history.has(entityId)) {
      this.history.set(entityId, []);
    }

    const history = this.history.get(entityId);
    history.push({
      type: 'response',
      response,
      timestamp: new Date().toISOString()
    });

    // Trim history if too long
    if (history.length > this.config.maxHistorySize) {
      history.splice(0, history.length - this.config.maxHistorySize);
    }
  }

  /**
   * Get conversation history for NPC
   * @param {string} entityId - NPC entity ID
   * @param {number} limit - Number of recent entries
   * @returns {Array} History entries
   */
  getHistory(entityId, limit = 10) {
    const history = this.history.get(entityId) || [];
    return history.slice(-limit);
  }

  /**
   * Get formatted conversation summary
   * @param {string} entityId - NPC entity ID
   * @param {number} limit - Number of recent exchanges
   * @returns {string} Formatted summary
   */
  getConversationSummary(entityId, limit = 5) {
    const history = this.getHistory(entityId, limit * 2); // incoming + response pairs
    const lines = [];

    for (const entry of history) {
      if (entry.type === 'incoming') {
        const batch = entry.batch;
        // Add player messages
        for (const msg of batch.playerMessages) {
          lines.push(`<${msg.sender}> ${msg.content}`);
        }
        // Add NPC messages
        for (const msg of batch.npcMessages) {
          lines.push(`<${msg.sender}> ${msg.content}`);
        }
      } else if (entry.type === 'response') {
        // Add NPC's responses
        for (const say of entry.response.say) {
          lines.push(`[You said] ${say}`);
        }
      }
    }

    return lines.join('\n');
  }

  /**
   * Clear queue for entity
   * @param {string} entityId - NPC entity ID
   */
  clearQueue(entityId) {
    if (this.queues.has(entityId)) {
      this.queues.get(entityId).length = 0;
    }
    if (this.batchTimers.has(entityId)) {
      clearTimeout(this.batchTimers.get(entityId));
      this.batchTimers.delete(entityId);
    }
  }

  /**
   * Clear history for entity
   * @param {string} entityId - NPC entity ID
   */
  clearHistory(entityId) {
    if (this.history.has(entityId)) {
      this.history.delete(entityId);
    }
  }

  /**
   * Get queue size for entity
   * @param {string} entityId - NPC entity ID
   * @returns {number} Queue size
   */
  getQueueSize(entityId) {
    const queue = this.queues.get(entityId);
    return queue ? queue.length : 0;
  }

  /**
   * Check if entity is currently processing
   * @param {string} entityId - NPC entity ID
   * @returns {boolean} Processing status
   */
  isProcessing(entityId) {
    return this.processing.get(entityId) || false;
  }

  /**
   * Force immediate processing (skip batch delay)
   * @param {string} entityId - NPC entity ID
   * @returns {Promise<Object>} Batched messages
   */
  async forceProcess(entityId) {
    if (this.batchTimers.has(entityId)) {
      clearTimeout(this.batchTimers.get(entityId));
      this.batchTimers.delete(entityId);
    }
    return await this.processBatch(entityId);
  }

  /**
   * Get stats for all queues
   * @returns {Object} Queue statistics
   */
  getStats() {
    const stats = {
      totalQueues: this.queues.size,
      totalMessages: 0,
      processingCount: 0,
      queues: {}
    };

    for (const [entityId, queue] of this.queues.entries()) {
      stats.totalMessages += queue.length;
      stats.queues[entityId] = {
        size: queue.length,
        processing: this.isProcessing(entityId),
        historySize: this.history.get(entityId)?.length || 0
      };
    }

    for (const processing of this.processing.values()) {
      if (processing) stats.processingCount++;
    }

    return stats;
  }
}

// Export class (not singleton, allow multiple instances)
export default ConversationQueue;
