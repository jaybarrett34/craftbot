import { rconClient } from './rcon-client.js';

/**
 * Position Tracker
 * 
 * Tracks AI entity positions and detects when they die/despawn
 * Uses Minecraft entity tags to identify and track entities
 */
class PositionTracker {
  constructor() {
    this.updateInterval = 5000; // Update positions every 5 seconds
    this.entities = new Map(); // entityId -> { name, tag, position, lastSeen }
    this.intervalId = null;
    this.running = false;
  }

  /**
   * Start tracking positions
   */
  start() {
    if (this.running) {
      console.log('[PositionTracker] Already running');
      return;
    }

    console.log('[PositionTracker] Starting position tracker...');
    this.running = true;
    
    // Initial update
    this.updateAllPositions();
    
    // Schedule periodic updates
    this.intervalId = setInterval(() => {
      this.updateAllPositions();
    }, this.updateInterval);
  }

  /**
   * Stop tracking positions
   */
  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.running = false;
    console.log('[PositionTracker] Stopped position tracker');
  }

  /**
   * Register an entity for tracking
   * @param {Object} entity - Entity configuration
   */
  registerEntity(entity) {
    if (!entity.appearance?.entityTag) {
      console.warn(`[PositionTracker] Entity "${entity.name}" has no entityTag, cannot track`);
      return;
    }

    this.entities.set(entity.id, {
      id: entity.id,
      name: entity.name,
      tag: entity.appearance.entityTag,
      position: entity.appearance.position || null,
      lastSeen: Date.now(),
      alive: true
    });

    console.log(`[PositionTracker] Registered entity "${entity.name}" with tag "${entity.appearance.entityTag}"`);
  }

  /**
   * Unregister an entity from tracking
   * @param {string} entityId - Entity ID
   */
  unregisterEntity(entityId) {
    this.entities.delete(entityId);
    console.log(`[PositionTracker] Unregistered entity ${entityId}`);
  }

  /**
   * Get entity position by ID
   * @param {string} entityId - Entity ID
   * @returns {Object|null} Position {x, y, z} or null
   */
  getPosition(entityId) {
    const entity = this.entities.get(entityId);
    return entity?.position || null;
  }

  /**
   * Check if entity is alive
   * @param {string} entityId - Entity ID
   * @returns {boolean}
   */
  isAlive(entityId) {
    const entity = this.entities.get(entityId);
    return entity?.alive || false;
  }

  /**
   * Get all tracked entities
   * @returns {Array}
   */
  getTrackedEntities() {
    return Array.from(this.entities.values());
  }

  /**
   * Update positions for all tracked entities
   */
  async updateAllPositions() {
    if (this.entities.size === 0) {
      return;
    }

    const updates = [];
    for (const [entityId, entity] of this.entities) {
      updates.push(this.updateEntityPosition(entityId, entity));
    }

    await Promise.allSettled(updates);
  }

  /**
   * Update position for a single entity
   * @param {string} entityId - Entity ID
   * @param {Object} entity - Entity tracking data
   */
  async updateEntityPosition(entityId, entity) {
    try {
      // Check if entity still exists by trying to get its position
      // This is silent and doesn't spam chat (unlike /say)
      const posCommand = `data get entity @e[tag=${entity.tag},limit=1] Pos`;
      const posResult = await rconClient.sendCommand(posCommand);

      // If entity doesn't exist, RCON will return an error or "No entity was found"
      if (!posResult.success || posResult.response.includes('No entity was found') || posResult.response.includes('Invalid name or UUID')) {
        if (entity.alive) {
          console.log(`[PositionTracker] Entity "${entity.name}" (${entity.tag}) has died or despawned`);
          entity.alive = false;
          entity.position = null;
          
          // Emit death event (for future event system)
          this.onEntityDeath(entityId, entity);
        }
        return;
      }

      // Entity exists and we have its position data
      if (posResult.success) {
        // Parse position from response
        // Example: "Trader has the following entity data: [123.45d, 64.0d, 678.90d]"
        const posMatch = posResult.response.match(/\[([-\d.]+)d?, ([-\d.]+)d?, ([-\d.]+)d?\]/);
        
        if (posMatch) {
          const newPosition = {
            x: parseFloat(posMatch[1]),
            y: parseFloat(posMatch[2]),
            z: parseFloat(posMatch[3])
          };

          // Check if position changed
          const oldPos = entity.position;
          const moved = !oldPos || 
            Math.abs(newPosition.x - oldPos.x) > 0.5 ||
            Math.abs(newPosition.y - oldPos.y) > 0.5 ||
            Math.abs(newPosition.z - oldPos.z) > 0.5;

          entity.position = newPosition;
          entity.lastSeen = Date.now();
          entity.alive = true;

          if (moved) {
            console.log(`[PositionTracker] Entity "${entity.name}" moved to (${newPosition.x.toFixed(1)}, ${newPosition.y.toFixed(1)}, ${newPosition.z.toFixed(1)})`);
          }
        }
      }
    } catch (error) {
      console.error(`[PositionTracker] Error updating position for "${entity.name}":`, error.message);
    }
  }

  /**
   * Handle entity death event
   * @param {string} entityId - Entity ID
   * @param {Object} entity - Entity tracking data
   */
  onEntityDeath(entityId, entity) {
    // Can be extended to emit events or notify other systems
    console.log(`[PositionTracker] 💀 Entity "${entity.name}" has died`);
  }

  /**
   * Respawn tracking for an entity (if it's spawned again)
   * @param {string} entityId - Entity ID
   * @param {Object} position - New position
   */
  respawnEntity(entityId, position) {
    const entity = this.entities.get(entityId);
    if (entity) {
      entity.position = position;
      entity.alive = true;
      entity.lastSeen = Date.now();
      console.log(`[PositionTracker] Entity "${entity.name}" respawned at (${position.x}, ${position.y}, ${position.z})`);
    }
  }

  /**
   * Get statistics
   */
  getStats() {
    const entities = Array.from(this.entities.values());
    return {
      running: this.running,
      totalEntities: entities.length,
      aliveEntities: entities.filter(e => e.alive).length,
      deadEntities: entities.filter(e => !e.alive).length,
      updateInterval: this.updateInterval
    };
  }

  /**
   * Update config for an entity (when edited in UI)
   * @param {Object} entity - Updated entity configuration
   */
  updateEntity(entity) {
    const tracked = this.entities.get(entity.id);
    if (tracked) {
      tracked.name = entity.name;
      if (entity.appearance?.entityTag) {
        tracked.tag = entity.appearance.entityTag;
      }
      if (entity.appearance?.position) {
        tracked.position = entity.appearance.position;
      }
    }
  }
}

// Export singleton instance
export const positionTracker = new PositionTracker();

