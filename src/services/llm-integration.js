/**
 * LLM Integration Manager
 *
 * Main integration layer that connects all LLM services together
 * Provides high-level API for handling NPC conversations
 */

import LLMParser from './llm-parser.js';
import ConversationQueue from './conversation-queue.js';
import OllamaClient from './ollama-client.js';

class LLMIntegration {
  constructor(options = {}) {
    this.parser = LLMParser;
    this.queue = new ConversationQueue(options.queue || {});
    this.ollama = new OllamaClient(options.ollama || {});
    this.entities = new Map(); // entityId -> entity config
    this.callbacks = {
      onSay: options.onSay || this.defaultOnSay,
      onFunction: options.onFunction || this.defaultOnFunction,
      onError: options.onError || this.defaultOnError
    };
  }

  /**
   * Register an NPC entity
   * @param {Object} entity - Entity configuration
   */
  registerEntity(entity) {
    if (!entity.id) {
      throw new Error('Entity must have an id');
    }
    this.entities.set(entity.id, entity);
    console.log(`Registered entity: ${entity.name} (${entity.id})`);
  }

  /**
   * Unregister an NPC entity
   * @param {string} entityId - Entity ID
   */
  unregisterEntity(entityId) {
    this.entities.delete(entityId);
    this.queue.clearQueue(entityId);
    this.queue.clearHistory(entityId);
    console.log(`Unregistered entity: ${entityId}`);
  }

  /**
   * Handle incoming message for an NPC
   * @param {string} entityId - Target NPC entity ID
   * @param {Object} message - Message object
   * @returns {Promise<void>}
   */
  async handleMessage(entityId, message) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      console.error(`Entity not found: ${entityId}`);
      return;
    }

    if (!entity.llm?.enabled) {
      console.log(`LLM disabled for entity: ${entityId}`);
      return;
    }

    // Add to queue
    const success = this.queue.enqueue(entityId, message);
    if (!success) {
      console.error(`Failed to enqueue message for ${entityId}`);
      return;
    }

    // Queue will batch and process automatically
    // Or we can force immediate processing:
    // await this.processEntity(entityId);
  }

  /**
   * Process pending messages for an entity
   * @param {string} entityId - Entity ID
   * @returns {Promise<Object|null>} Parsed response or null
   */
  async processEntity(entityId) {
    const entity = this.entities.get(entityId);
    if (!entity) {
      console.error(`Entity not found: ${entityId}`);
      return null;
    }

    if (this.queue.isProcessing(entityId)) {
      console.log(`Entity ${entityId} is already processing`);
      return null;
    }

    // Get batched messages
    const batch = await this.queue.processBatch(entityId);
    if (!batch || batch.messageCount === 0) {
      return null;
    }

    try {
      // Get conversation summary
      const summary = this.queue.getConversationSummary(entityId, 5);

      // Generate LLM response
      const response = await this.ollama.generateResponse(
        entity,
        batch,
        summary
      );

      if (!response?.message?.content) {
        throw new Error('Invalid response from LLM');
      }

      // Parse response
      const parsed = this.parser.parse(response.message.content);

      // Add to history
      this.queue.addResponseToHistory(entityId, parsed);

      // Execute actions
      await this.executeActions(entity, parsed);

      // Log
      console.log(`${entity.name}: ${this.parser.formatForLogging(parsed)}`);

      return parsed;

    } catch (error) {
      console.error(`Error processing entity ${entityId}:`, error);
      this.callbacks.onError(entity, error);
      return null;
    }
  }

  /**
   * Execute parsed actions
   * @param {Object} entity - Entity configuration
   * @param {Object} parsed - Parsed LLM response
   */
  async executeActions(entity, parsed) {
    // Handle silence
    if (parsed.silence) {
      console.log(`${entity.name} chose to remain silent`);
      return;
    }

    // Execute say messages
    for (const sayMsg of parsed.say) {
      const sanitized = this.parser.sanitizeForMinecraft(sayMsg);
      await this.callbacks.onSay(entity, sanitized);
    }

    // Execute functions
    const functions = this.parser.parseFunctions(parsed.functions);
    for (const func of functions) {
      if (this.isCommandAllowed(func.command, entity.permissions)) {
        await this.callbacks.onFunction(entity, func);
      } else {
        console.warn(`Command not allowed for ${entity.name}: ${func.command}`);
      }
    }
  }

  /**
   * Check if command is allowed for entity
   * @param {string} command - Command to check
   * @param {Object} permissions - Entity permissions
   * @returns {boolean} Allowed status
   */
  isCommandAllowed(command, permissions) {
    if (!permissions?.canExecuteCommands) {
      return false;
    }

    // Extract command name (remove leading /)
    const cmdName = command.trim().split(' ')[0].replace(/^\//, '');

    // Check denied list first
    if (permissions.deniedCommands?.includes(cmdName)) {
      return false;
    }

    // Check allowed list
    if (permissions.allowedCommands?.includes('*')) {
      return true;
    }

    if (permissions.allowedCommands?.includes(cmdName)) {
      return true;
    }

    return false;
  }

  /**
   * Process all entities with pending messages
   * @returns {Promise<number>} Number of entities processed
   */
  async processAllEntities() {
    let processed = 0;

    for (const [entityId, entity] of this.entities) {
      if (entity.llm?.enabled && this.queue.getQueueSize(entityId) > 0) {
        await this.processEntity(entityId);
        processed++;
      }
    }

    return processed;
  }

  /**
   * Start auto-processing loop
   * @param {number} interval - Processing interval in ms
   */
  startAutoProcessing(interval = 1000) {
    if (this.autoProcessingInterval) {
      console.warn('Auto-processing already started');
      return;
    }

    this.autoProcessingInterval = setInterval(async () => {
      await this.processAllEntities();
    }, interval);

    console.log(`Auto-processing started (interval: ${interval}ms)`);
  }

  /**
   * Stop auto-processing loop
   */
  stopAutoProcessing() {
    if (this.autoProcessingInterval) {
      clearInterval(this.autoProcessingInterval);
      this.autoProcessingInterval = null;
      console.log('Auto-processing stopped');
    }
  }

  /**
   * Get statistics for all entities
   * @returns {Object} Statistics
   */
  getStats() {
    return {
      entities: {
        total: this.entities.size,
        enabled: Array.from(this.entities.values()).filter(e => e.llm?.enabled).length
      },
      queue: this.queue.getStats()
    };
  }

  /**
   * Check Ollama availability
   * @returns {Promise<boolean>} Availability status
   */
  async checkOllamaAvailability() {
    return await this.ollama.checkAvailability();
  }

  /**
   * List available models
   * @returns {Promise<Array<string>>} Model names
   */
  async listModels() {
    return await this.ollama.listModels();
  }

  // Default callbacks

  defaultOnSay(entity, message) {
    console.log(`[SAY] ${entity.name}: ${message}`);
  }

  defaultOnFunction(entity, func) {
    console.log(`[FUNCTION] ${entity.name}: ${func.command}`);
  }

  defaultOnError(entity, error) {
    console.error(`[ERROR] ${entity.name}:`, error);
  }
}

export default LLMIntegration;
