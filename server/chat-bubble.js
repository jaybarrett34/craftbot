import { rconClient } from './rcon-client.js';
import { positionTracker } from './position-tracker.js';

/**
 * Chat Bubble Manager
 * 
 * Displays chat bubbles above entities using text_display entities in Minecraft 1.19.4+
 */
class ChatBubbleManager {
  constructor() {
    this.activeBubbles = new Map(); // entityId -> { displayId, timer }
    this.bubbleDuration = 5000; // 5 seconds default
  }

  /**
   * Display a chat bubble above an entity
   * @param {Object} entity - Entity configuration
   * @param {string} message - Message to display
   * @param {number} duration - Duration in milliseconds (optional)
   */
  async displayBubble(entity, message, duration = this.bubbleDuration) {
    try {
      // Get entity position from tracker
      const position = positionTracker.getPosition(entity.id);
      
      if (!position) {
        console.warn(`[ChatBubble] No position for entity "${entity.name}", cannot display bubble`);
        return false;
      }

      // Remove existing bubble if any
      await this.removeBubble(entity.id);

      // Format message for display (truncate if too long)
      const displayMessage = message.length > 100 
        ? message.substring(0, 97) + '...' 
        : message;

      // Escape quotes for the text string
      const escapedMessage = displayMessage
        .replace(/\\/g, '\\\\')
        .replace(/"/g, '\\"')
        .replace(/\n/g, ' '); // Replace newlines with spaces

      // Create unique tag for this bubble
      const bubbleTag = `bubble_${entity.id}_${Date.now()}`;

      // Calculate position above entity (2 blocks up)
      const bubbleY = position.y + 2;

      // Summon text_display entity - using JSON text component format for Minecraft 1.21.9
      // Minecraft requires proper JSON text component wrapped in single quotes
      const summonCommand = `summon text_display ${position.x} ${bubbleY} ${position.z} {Tags:["chat_bubble","${bubbleTag}"],text:'{"text":"${escapedMessage}"}',billboard:"center",see_through:1b,background:0,line_width:200}`;
      
      const result = await rconClient.sendCommand(summonCommand);

      if (!result.success) {
        console.error(`[ChatBubble] Failed to summon chat bubble:`, result.error);
        return false;
      }

      console.log(`[ChatBubble] Displayed bubble for "${entity.name}": "${displayMessage}"`);

      // Store bubble info
      const bubbleInfo = {
        displayId: bubbleTag,
        createdAt: Date.now()
      };

      // Set timer to remove bubble after duration
      bubbleInfo.timer = setTimeout(() => {
        this.removeBubble(entity.id);
      }, duration);

      this.activeBubbles.set(entity.id, bubbleInfo);

      return true;
    } catch (error) {
      console.error(`[ChatBubble] Error displaying bubble:`, error);
      return false;
    }
  }

  /**
   * Remove chat bubble for an entity
   * @param {string} entityId - Entity ID
   */
  async removeBubble(entityId) {
    const bubbleInfo = this.activeBubbles.get(entityId);
    
    if (!bubbleInfo) {
      return;
    }

    // Clear timer
    if (bubbleInfo.timer) {
      clearTimeout(bubbleInfo.timer);
    }

    // Kill the text_display entity
    try {
      const killCommand = `kill @e[tag=${bubbleInfo.displayId}]`;
      await rconClient.sendCommand(killCommand);
      console.log(`[ChatBubble] Removed bubble ${bubbleInfo.displayId}`);
    } catch (error) {
      console.error(`[ChatBubble] Error removing bubble:`, error);
    }

    this.activeBubbles.delete(entityId);
  }

  /**
   * Remove all chat bubbles
   */
  async removeAllBubbles() {
    const promises = [];
    for (const entityId of this.activeBubbles.keys()) {
      promises.push(this.removeBubble(entityId));
    }
    await Promise.all(promises);
  }

  /**
   * Clean up expired bubbles (fallback in case timers fail)
   */
  async cleanupExpiredBubbles() {
    const now = Date.now();
    const toRemove = [];

    for (const [entityId, bubbleInfo] of this.activeBubbles) {
      if (now - bubbleInfo.createdAt > this.bubbleDuration + 1000) {
        toRemove.push(entityId);
      }
    }

    for (const entityId of toRemove) {
      await this.removeBubble(entityId);
    }
  }

  /**
   * Start periodic cleanup
   */
  startCleanup() {
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredBubbles();
    }, 10000); // Every 10 seconds
  }

  /**
   * Stop periodic cleanup
   */
  stopCleanup() {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }

  /**
   * Get stats
   */
  getStats() {
    return {
      activeBubbles: this.activeBubbles.size,
      bubbleDuration: this.bubbleDuration
    };
  }
}

// Export singleton instance
export const chatBubbleManager = new ChatBubbleManager();

