import fs from 'fs';
import { rconClient } from './rcon-client.js';
import { positionTracker } from './position-tracker.js';
import EventEmitter from 'events';

class ChatMonitor extends EventEmitter {
  constructor() {
    super();
    this.logPath = process.env.MC_LOG_PATH || '';
    this.pollInterval = parseInt(process.env.CHAT_POLL_INTERVAL) || 1000;
    this.monitoring = false;
    this.lastPosition = 0;
    this.intervalId = null;
    this.chatHistory = [];
    this.maxHistorySize = 1000;
    this.detectedAIEntities = new Set(); // Track detected entities to avoid duplicates

    // Pattern matching for different chat types
    this.patterns = {
      chat: /\[([^\]]+)\] \[Server thread\/INFO\]: (?:\[Not Secure\] )?<([^>]+)> (.+)/,
      serverMessage: /\[([^\]]+)\] \[Server thread\/INFO\]: \[Server\] (.+)/,
      join: /\[([^\]]+)\] \[Server thread\/INFO\]: ([^\s]+) joined the game/,
      leave: /\[([^\]]+)\] \[Server thread\/INFO\]: ([^\s]+) left the game/,
      death: /\[([^\]]+)\] \[Server thread\/INFO\]: ([^\s]+) (.+)/,
      achievement: /\[([^\]]+)\] \[Server thread\/INFO\]: ([^\s]+) has (made the advancement|completed the challenge|reached the goal) \[(.+)\]/,
      aiEntitySpawn: /\[([^\]]+)\] \[Server thread\/INFO\]: .*Summoned new .+/i
    };

    this.aiTagPattern = /\[AI\]/i;
    // Pattern to extract AI entity name from CustomName NBT data
    this.aiEntityNamePattern = /\[AI\]\s*(\w+)/;
  }

  start() {
    if (this.monitoring) {
      console.log('[ChatMonitor] Already monitoring');
      return;
    }

    console.log('[ChatMonitor] Starting chat monitor...');
    this.monitoring = true;

    // If log path is provided, monitor the log file
    if (this.logPath && fs.existsSync(this.logPath)) {
      console.log(`[ChatMonitor] Monitoring log file: ${this.logPath}`);
      this.startLogMonitoring();
    } else {
      console.log('[ChatMonitor] No valid log path, using RCON polling (limited functionality)');
      // Note: RCON doesn't provide real-time chat, so this is less effective
      // In production, you'd want to use a server plugin or monitor the log file
    }
  }

  stop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
    this.monitoring = false;
    console.log('[ChatMonitor] Stopped monitoring');
  }

  startLogMonitoring() {
    // Get initial file size
    try {
      const stats = fs.statSync(this.logPath);
      this.lastPosition = stats.size;
    } catch (error) {
      console.error('[ChatMonitor] Error getting initial file size:', error.message);
      this.lastPosition = 0;
    }

    // Poll the log file
    this.intervalId = setInterval(() => {
      this.checkForNewLines();
    }, this.pollInterval);
  }

  checkForNewLines() {
    try {
      const stats = fs.statSync(this.logPath);
      const currentSize = stats.size;

      // Check if file has grown
      if (currentSize > this.lastPosition) {
        // Read new content
        const stream = fs.createReadStream(this.logPath, {
          start: this.lastPosition,
          end: currentSize
        });

        let buffer = '';

        stream.on('data', (chunk) => {
          buffer += chunk.toString();
        });

        stream.on('end', () => {
          const lines = buffer.split('\n');

          // Process each line
          lines.forEach((line) => {
            if (line.trim()) {
              this.processLogLine(line);
            }
          });

          this.lastPosition = currentSize;
        });

        stream.on('error', (error) => {
          console.error('[ChatMonitor] Error reading log file:', error.message);
        });
      } else if (currentSize < this.lastPosition) {
        // File was truncated or rotated
        console.log('[ChatMonitor] Log file was truncated or rotated');
        this.lastPosition = 0;
      }
    } catch (error) {
      console.error('[ChatMonitor] Error checking log file:', error.message);
    }
  }

  processLogLine(line) {
    // Try to match different patterns
    const chatMatch = line.match(this.patterns.chat);
    const serverMatch = line.match(this.patterns.serverMessage);
    const joinMatch = line.match(this.patterns.join);
    const leaveMatch = line.match(this.patterns.leave);
    const aiEntitySpawnMatch = line.match(this.patterns.aiEntitySpawn);

    if (chatMatch) {
      const [, timestamp, player, message] = chatMatch;
      this.handleChatMessage(player, message, timestamp);
    } else if (serverMatch) {
      const [, timestamp, message] = serverMatch;
      this.handleServerMessage(message, timestamp);
    } else if (joinMatch) {
      const [, timestamp, player] = joinMatch;
      this.handlePlayerJoin(player, timestamp);
    } else if (leaveMatch) {
      const [, timestamp, player] = leaveMatch;
      this.handlePlayerLeave(player, timestamp);
    } else if (aiEntitySpawnMatch) {
      const [, timestamp] = aiEntitySpawnMatch;
      this.handleAIEntitySpawn(line, timestamp);
    }
  }

  handleChatMessage(player, message, timestamp) {
    const chatMessage = {
      type: 'chat',
      player,
      message,
      timestamp: timestamp || new Date().toISOString(),
      raw: `<${player}> ${message}`
    };

    // Add to history
    this.addToHistory(chatMessage);

    // Check if this is an AI entity message
    const isAIMessage = this.aiTagPattern.test(player) || this.aiTagPattern.test(message);
    
    if (isAIMessage) {
      chatMessage.isAI = true;
      
      // If player name contains [AI] tag, trigger entity spawn detection
      if (this.aiTagPattern.test(player)) {
        this.detectAIEntityFromName(player, timestamp);
      }
      
      // Emit both ai_message AND chat events
      // This allows AI-to-AI communication while still tracking AI messages separately
      this.emit('ai_message', chatMessage);
      console.log(`[ChatMonitor] AI message: <${player}> ${message}`);
    }

    // CRITICAL FIX: Always emit 'chat' event (for both player and AI messages)
    // The shouldEntityRespond filter will handle whether to respond based on respondToAI setting
    this.emit('chat', chatMessage);

    if (!isAIMessage) {
      console.log(`[ChatMonitor] Player chat: <${player}> ${message}`);
    }
  }

  handleServerMessage(message, timestamp) {
    const serverMessage = {
      type: 'server',
      message,
      timestamp: timestamp || new Date().toISOString(),
      raw: `[Server] ${message}`
    };

    this.addToHistory(serverMessage);
    this.emit('server_message', serverMessage);

    console.log(`[ChatMonitor] Server: ${message}`);
  }

  handlePlayerJoin(player, timestamp) {
    const joinMessage = {
      type: 'join',
      player,
      timestamp: timestamp || new Date().toISOString(),
      raw: `${player} joined the game`
    };

    this.addToHistory(joinMessage);
    this.emit('player_join', joinMessage);

    console.log(`[ChatMonitor] Player joined: ${player}`);
  }

  handlePlayerLeave(player, timestamp) {
    const leaveMessage = {
      type: 'leave',
      player,
      timestamp: timestamp || new Date().toISOString(),
      raw: `${player} left the game`
    };

    this.addToHistory(leaveMessage);
    this.emit('player_leave', leaveMessage);

    console.log(`[ChatMonitor] Player left: ${player}`);
  }

  detectAIEntityFromName(fullName, timestamp) {
    // Extract entity name from formats like "[AI] EntityName" or "[AI]EntityName"
    const nameMatch = fullName.match(this.aiEntityNamePattern);
    if (!nameMatch) {
      console.log('[ChatMonitor] Could not extract entity name from:', fullName);
      return;
    }

    const entityName = nameMatch[1];

    // Check if we've already detected this entity
    if (this.detectedAIEntities.has(entityName)) {
      return;
    }

    // Mark as detected
    this.detectedAIEntities.add(entityName);

    const spawnMessage = {
      type: 'ai_entity_spawn',
      entityName,
      timestamp: timestamp || new Date().toISOString(),
      raw: `[AI] entity detected: ${entityName}`
    };

    this.addToHistory(spawnMessage);
    this.emit('ai_entity_spawn', spawnMessage);

    console.log(`[ChatMonitor] AI entity detected from name: ${entityName}`);
  }

  handleAIEntitySpawn(logLine, timestamp) {
    // Check if this is an AI entity by looking for [AI] tag in the line
    if (!this.aiTagPattern.test(logLine)) {
      return;
    }

    // Try to extract the entity name from the CustomName
    const nameMatch = logLine.match(this.aiEntityNamePattern);
    if (!nameMatch) {
      console.log('[ChatMonitor] Found [AI] tag but could not extract entity name');
      return;
    }

    const entityName = nameMatch[1];

    // Check if we've already detected this entity
    if (this.detectedAIEntities.has(entityName)) {
      return;
    }

    // Mark as detected
    this.detectedAIEntities.add(entityName);

    const spawnMessage = {
      type: 'ai_entity_spawn',
      entityName,
      timestamp: timestamp || new Date().toISOString(),
      raw: `[AI] entity detected: ${entityName}`
    };

    this.addToHistory(spawnMessage);
    this.emit('ai_entity_spawn', spawnMessage);

    console.log(`[ChatMonitor] AI entity detected: ${entityName}`);
  }

  addToHistory(message) {
    this.chatHistory.push(message);

    // Limit history size
    if (this.chatHistory.length > this.maxHistorySize) {
      this.chatHistory.shift();
    }
  }

  getChatHistory(limit = 50, filter = {}) {
    let history = [...this.chatHistory];

    // Apply filters
    if (filter.type) {
      history = history.filter(msg => msg.type === filter.type);
    }

    if (filter.player) {
      history = history.filter(msg => msg.player === filter.player);
    }

    if (filter.since) {
      history = history.filter(msg =>
        new Date(msg.timestamp) >= new Date(filter.since)
      );
    }

    if (filter.excludeAI) {
      history = history.filter(msg => !msg.isAI);
    }

    // Return most recent messages
    return history.slice(-limit);
  }

  searchHistory(query, limit = 20) {
    const results = this.chatHistory.filter(msg => {
      if (msg.message && msg.message.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      if (msg.player && msg.player.toLowerCase().includes(query.toLowerCase())) {
        return true;
      }
      return false;
    });

    return results.slice(-limit);
  }

  // Check if a message mentions an NPC
  checkNPCMention(message, npcName) {
    const normalizedMessage = message.toLowerCase();
    const normalizedNPC = npcName.toLowerCase();
    return normalizedMessage.includes(normalizedNPC);
  }

  // Check if a player is near an NPC (requires position data)
  async checkProximity(playerName, npcPosition, maxDistance = 10) {
    try {
      // Get player position via RCON
      const result = await rconClient.sendCommand(`data get entity ${playerName} Pos`);

      if (!result.success) {
        return false;
      }

      // Parse position (simplified - real implementation would parse NBT data)
      // Example response: "Player has the following entity data: [123.45d, 64.0d, 678.90d]"
      const posMatch = result.response.match(/\[([\d.-]+)d?, ([\d.-]+)d?, ([\d.-]+)d?\]/);

      if (!posMatch) {
        return false;
      }

      const [, x, y, z] = posMatch.map(parseFloat);
      const playerPos = { x, y, z };

      // Calculate distance
      const distance = Math.sqrt(
        Math.pow(playerPos.x - npcPosition.x, 2) +
        Math.pow(playerPos.y - npcPosition.y, 2) +
        Math.pow(playerPos.z - npcPosition.z, 2)
      );

      return distance <= maxDistance;
    } catch (error) {
      console.error('[ChatMonitor] Error checking proximity:', error.message);
      return false;
    }
  }

  // Determine if an entity should respond to a chat message
  async shouldEntityRespond(chatMessage, entity) {
    // If entity is disabled, don't respond
    if (!entity.enabled || !entity.llm?.enabled) {
      return false;
    }

    // CRITICAL: Don't respond to own messages (prevent feedback loop)
    if (chatMessage.sourceEntityId && chatMessage.sourceEntityId === entity.id) {
      console.log(`[ChatMonitor] 🔇 Entity "${entity.name}" (${entity.id}) ignoring own message`);
      return false;
    }

    // Get chat filters (use defaults if not set)
    const chatFilters = entity.knowledge?.chatFilters || {
      respondToPlayers: true,
      respondToAI: false,
      requiresMention: false
    };

    // Check chat filters
    // If message is from AI and entity doesn't respond to AI
    if (chatMessage.isAI && !chatFilters.respondToAI) {
      console.log(`[ChatMonitor] ❌ Entity "${entity.name}" (${entity.id}) not responding to AI "${chatMessage.player}" - respondToAI is false`);
      return false;
    }

    // If message is from player and entity doesn't respond to players
    if (!chatMessage.isAI && !chatFilters.respondToPlayers) {
      console.log(`[ChatMonitor] ❌ Entity "${entity.name}" (${entity.id}) not responding to player "${chatMessage.player}" - respondToPlayers is false`);
      return false;
    }

    // Check if mention is required
    if (chatFilters.requiresMention) {
      const isMentioned = this.checkNPCMention(chatMessage.message, entity.name);
      if (!isMentioned) {
        return false;
      }
    }

    // Check if entity requires proximity (use chatFilters first, then fall back to parent level)
    // IMPORTANT: Console entities (type='console') ignore proximity requirements
    const isConsoleEntity = entity.type === 'console';
    const proximityRequired = isConsoleEntity ? false : (
      chatFilters.proximityRequired !== undefined
        ? chatFilters.proximityRequired
        : entity.knowledge?.proximityRequired
    );

    if (proximityRequired && !isConsoleEntity) {
      const maxProximity = chatFilters.maxProximity || entity.knowledge?.maxProximity || 10;

      // Get entity position from position tracker (dynamically updated)
      const entityPosition = positionTracker.getPosition(entity.id);

      // If entity has a position, check proximity
      if (entityPosition) {
        const isNear = await this.checkProximity(
          chatMessage.player,
          entityPosition,
          maxProximity
        );

        if (!isNear) {
          console.log(`[ChatMonitor] ❌ Entity "${entity.name}" (${entity.id}) too far from ${chatMessage.player} (max: ${maxProximity} blocks)`);
          return false;
        }
      } else {
        // No position available - DENY response (proximity required but no position tracked)
        console.log(`[ChatMonitor] ❌ Entity "${entity.name}" (${entity.id}) requires proximity but has no position tracked`);
        console.log(`[ChatMonitor] → Ensure entity has appearance.entityTag and is registered with position tracker`);
        return false;
      }
    }

    // Check response probability (0.0 to 1.0)
    const responseProbability = chatFilters.responseProbability !== undefined
      ? chatFilters.responseProbability
      : 1.0; // Default to always respond

    // 0.0 = never respond (effectively disabled)
    if (responseProbability <= 0.0) {
      console.log(`[ChatMonitor] ❌ Entity "${entity.name}" (${entity.id}) not responding - responseProbability is 0`);
      return false;
    }

    // 1.0 = always respond (skip probability check)
    if (responseProbability >= 1.0) {
      console.log(`[ChatMonitor] ✅ Entity "${entity.name}" (${entity.id}) WILL respond to "${chatMessage.player}" (isAI: ${chatMessage.isAI}) - probability: 100%`);
      return true;
    }

    // For values between 0.0 and 1.0, use message urgency heuristic
    const urgencyScore = this.calculateMessageUrgency(chatMessage, entity);

    // Adjust probability based on urgency
    // urgencyScore: 0-1 where 1 is most urgent
    // finalProbability = responseProbability * (0.3 + 0.7 * urgencyScore)
    // This means even at low responseProbability, urgent messages have better chance
    const finalProbability = responseProbability * (0.3 + 0.7 * urgencyScore);
    const randomValue = Math.random();

    const willRespond = randomValue < finalProbability;

    if (willRespond) {
      console.log(`[ChatMonitor] ✅ Entity "${entity.name}" (${entity.id}) WILL respond to "${chatMessage.player}" (isAI: ${chatMessage.isAI}) - probability: ${(finalProbability * 100).toFixed(0)}% (urgency: ${(urgencyScore * 100).toFixed(0)}%, roll: ${(randomValue * 100).toFixed(0)}%)`);
    } else {
      console.log(`[ChatMonitor] 🎲 Entity "${entity.name}" (${entity.id}) SKIPPED response due to probability - target: ${(finalProbability * 100).toFixed(0)}%, roll: ${(randomValue * 100).toFixed(0)}%`);
    }

    return willRespond;
  }

  /**
   * Calculate message urgency score (0-1) based on content and context
   * Higher score = more likely to respond even at low probability settings
   */
  calculateMessageUrgency(chatMessage, entity) {
    let urgency = 0.5; // Base urgency
    const message = chatMessage.message.toLowerCase();

    // Check for mentions of entity name
    if (message.includes(entity.name.toLowerCase())) {
      urgency += 0.3;
    }

    // Check for question marks (indicates question)
    if (message.includes('?')) {
      urgency += 0.15;
    }

    // Check for exclamation marks (indicates urgency/excitement)
    if (message.includes('!')) {
      urgency += 0.1;
    }

    // Check for urgent keywords
    const urgentKeywords = ['help', 'urgent', 'emergency', 'please', 'now', 'quick', 'asap', 'need'];
    if (urgentKeywords.some(keyword => message.includes(keyword))) {
      urgency += 0.2;
    }

    // Check for greeting keywords (higher urgency for greetings)
    const greetingKeywords = ['hello', 'hi', 'hey', 'greetings', 'howdy'];
    if (greetingKeywords.some(keyword => message.includes(keyword))) {
      urgency += 0.15;
    }

    // Cap at 1.0
    return Math.min(urgency, 1.0);
  }

  getStats() {
    return {
      monitoring: this.monitoring,
      historySize: this.chatHistory.length,
      logPath: this.logPath,
      pollInterval: this.pollInterval
    };
  }
}

// Export singleton instance
export const chatMonitor = new ChatMonitor();
