import { rconClient } from './rcon-client.js';

class StateFetcher {
  constructor() {
    this.cache = new Map();
    this.cacheTTL = parseInt(process.env.STATE_CACHE_TTL) || 5000;
  }

  getCacheKey(type, params) {
    return `${type}:${JSON.stringify(params)}`;
  }

  isCacheValid(cacheEntry) {
    if (!cacheEntry) return false;
    return Date.now() - cacheEntry.timestamp < this.cacheTTL;
  }

  getFromCache(key) {
    const entry = this.cache.get(key);
    if (this.isCacheValid(entry)) {
      return entry.data;
    }
    this.cache.delete(key);
    return null;
  }

  setCache(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  clearCache() {
    this.cache.clear();
  }

  // Parse RCON response into structured data
  parseResponse(response, type) {
    if (!response || typeof response !== 'string') {
      return null;
    }

    switch (type) {
      case 'list':
        return this.parsePlayerList(response);
      case 'data':
        return this.parseEntityData(response);
      case 'seed':
        return this.parseSeed(response);
      default:
        return response;
    }
  }

  parsePlayerList(response) {
    // Example: "There are 3 of a max of 20 players online: Player1, Player2, Player3"
    const match = response.match(/There are (\d+) of a max of (\d+) players online:(.*)/);
    if (!match) return { online: 0, max: 0, players: [] };

    const [, online, max, playersStr] = match;
    const players = playersStr.trim() ? playersStr.trim().split(',').map(p => p.trim()) : [];

    return {
      online: parseInt(online),
      max: parseInt(max),
      players
    };
  }

  parseEntityData(response) {
    try {
      // Try to parse as JSON (NBT-like data)
      return JSON.parse(response);
    } catch {
      return response;
    }
  }

  parseSeed(response) {
    // Example: "Seed: [1234567890]"
    const match = response.match(/Seed: \[(-?\d+)\]/);
    return match ? match[1] : response;
  }

  // Get player state information
  async getPlayerState(playerName, fields = [], entity = null) {
    const allowedFields = this.filterFieldsByPermission(fields, entity, 'player');
    const state = {};

    for (const field of allowedFields) {
      try {
        const value = await this.getPlayerField(playerName, field);
        if (value !== null) {
          state[field] = value;
        }
      } catch (error) {
        console.error(`[StateFetcher] Error fetching player field "${field}":`, error.message);
        state[field] = null;
      }
    }

    return state;
  }

  async getPlayerField(playerName, field) {
    const cacheKey = this.getCacheKey('player', { playerName, field });
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    let command;
    let parseType = 'raw';

    switch (field) {
      case 'health':
        command = `data get entity ${playerName} Health`;
        parseType = 'data';
        break;
      case 'position':
        command = `data get entity ${playerName} Pos`;
        parseType = 'data';
        break;
      case 'inventory':
        command = `data get entity ${playerName} Inventory`;
        parseType = 'data';
        break;
      case 'gamemode':
        command = `data get entity ${playerName} playerGameType`;
        parseType = 'data';
        break;
      case 'effects':
        command = `data get entity ${playerName} ActiveEffects`;
        parseType = 'data';
        break;
      case 'experience':
        command = `data get entity ${playerName} XpLevel`;
        parseType = 'data';
        break;
      default:
        return null;
    }

    const result = await rconClient.sendCommand(command);
    if (!result.success) return null;

    const parsed = this.parseResponse(result.response, parseType);
    this.setCache(cacheKey, parsed);
    return parsed;
  }

  // Get world state information
  async getWorldState(fields = [], entity = null) {
    const allowedFields = this.filterFieldsByPermission(fields, entity, 'world');
    const state = {};

    for (const field of allowedFields) {
      try {
        const value = await this.getWorldField(field);
        if (value !== null) {
          state[field] = value;
        }
      } catch (error) {
        console.error(`[StateFetcher] Error fetching world field "${field}":`, error.message);
        state[field] = null;
      }
    }

    return state;
  }

  async getWorldField(field) {
    const cacheKey = this.getCacheKey('world', { field });
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    let command;
    let parseType = 'raw';

    switch (field) {
      case 'time':
        command = 'time query daytime';
        break;
      case 'weather':
        command = 'weather query';
        break;
      case 'seed':
        command = 'seed';
        parseType = 'seed';
        break;
      case 'difficulty':
        command = 'difficulty';
        break;
      default:
        return null;
    }

    const result = await rconClient.sendCommand(command);
    if (!result.success) return null;

    const parsed = this.parseResponse(result.response, parseType);
    this.setCache(cacheKey, parsed);
    return parsed;
  }

  // Get players online
  async getOnlinePlayers() {
    const cacheKey = this.getCacheKey('players', {});
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    const result = await rconClient.sendCommand('list');
    if (!result.success) return { online: 0, max: 0, players: [] };

    const parsed = this.parseResponse(result.response, 'list');
    this.setCache(cacheKey, parsed);
    return parsed;
  }

  // Get nearby entities (requires coordinates)
  async getNearbyEntities(x, y, z, radius = 10, type = null) {
    const cacheKey = this.getCacheKey('entities', { x, y, z, radius, type });
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    // Use execute to find entities
    const typeFilter = type ? `type=${type}` : 'type=!minecraft:player';
    const command = `execute positioned ${x} ${y} ${z} run tag @e[distance=..${radius},${typeFilter}] add nearby_temp`;

    const result = await rconClient.sendCommand(command);
    if (!result.success) return [];

    // Clean up tags
    await rconClient.sendCommand('tag @e remove nearby_temp');

    // Parse result (simplified - real implementation would need more parsing)
    const entities = [];
    this.setCache(cacheKey, entities);
    return entities;
  }

  // Get entity data by selector
  async getEntityData(selector) {
    const cacheKey = this.getCacheKey('entity', { selector });
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    const result = await rconClient.sendCommand(`data get entity ${selector}`);
    if (!result.success) return null;

    const parsed = this.parseResponse(result.response, 'data');
    this.setCache(cacheKey, parsed);
    return parsed;
  }

  // Get server TPS and performance
  async getServerPerformance() {
    const cacheKey = this.getCacheKey('performance', {});
    const cached = this.getFromCache(cacheKey);
    if (cached !== null) return cached;

    // Note: TPS is not directly available via RCON in vanilla
    // This would require a server mod like Forge or Paper
    // For now, return basic info
    const players = await this.getOnlinePlayers();

    const performance = {
      players: players.online,
      maxPlayers: players.max,
      timestamp: Date.now()
    };

    this.setCache(cacheKey, performance);
    return performance;
  }

  // Filter fields based on entity permissions
  filterFieldsByPermission(fields, entity, type) {
    if (!entity || !entity.knowledge) {
      // If no entity or no knowledge config, allow all fields
      return fields;
    }

    const allowed = [];
    const knowledgeKey = type === 'player' ? 'canAccessPlayerState' : 'canAccessWorldState';
    const allowedFields = entity.knowledge[knowledgeKey] || [];

    // If entity has wildcard access or no restrictions
    if (allowedFields.includes('*') || allowedFields.length === 0) {
      return fields;
    }

    // Filter to only allowed fields
    for (const field of fields) {
      if (allowedFields.includes(field)) {
        allowed.push(field);
      }
    }

    return allowed;
  }

  // Check if entity can access this information
  canEntityAccessField(entity, field, type) {
    if (!entity || !entity.knowledge) return true;

    const knowledgeKey = type === 'player' ? 'canAccessPlayerState' : 'canAccessWorldState';
    const allowedFields = entity.knowledge[knowledgeKey] || [];

    return allowedFields.includes('*') || allowedFields.includes(field);
  }

  // Get comprehensive state for an entity
  async getComprehensiveState(entity, targetPlayer = null) {
    const state = {
      world: {},
      players: {},
      server: {}
    };

    // Get world state if entity has access
    if (entity.knowledge?.canAccessWorldState) {
      state.world = await this.getWorldState(
        entity.knowledge.canAccessWorldState,
        entity
      );
    }

    // Get player state if a target is specified
    if (targetPlayer && entity.knowledge?.canAccessPlayerState) {
      state.players[targetPlayer] = await this.getPlayerState(
        targetPlayer,
        entity.knowledge.canAccessPlayerState,
        entity
      );
    }

    // Get online players
    state.server = await this.getServerPerformance();
    state.server.players_list = await this.getOnlinePlayers();

    return state;
  }

  getStats() {
    return {
      cacheSize: this.cache.size,
      cacheTTL: this.cacheTTL
    };
  }
}

// Export singleton instance
export const stateFetcher = new StateFetcher();
