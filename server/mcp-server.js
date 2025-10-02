import express from 'express';
import cors from 'cors';
import { WebSocketServer } from 'ws';
import http from 'http';
import dotenv from 'dotenv';
import { defaultConfig } from '../src/config/defaultConfig.js';
import { rconClient } from './rcon-client.js';
import { chatMonitor } from './chat-monitor.js';
import { commandValidator } from './command-validator.js';
import { stateFetcher } from './state-fetcher.js';
import { conversationQueue } from './conversation-queue.js';
import { ollamaClient } from './ollama-client.js';
import { llmParser } from './llm-parser.js';
import { positionTracker } from './position-tracker.js';
import { chatBubbleManager } from './chat-bubble.js';
import { ollamaLogger } from './ollama-logger.js';

dotenv.config();

class MCPServer {
  constructor() {
    this.app = express();
    this.server = http.createServer(this.app);
    this.wss = new WebSocketServer({ server: this.server });
    this.port = process.env.SERVER_PORT || 3000;

    // Configuration storage
    this.config = { ...defaultConfig };
    this.entities = [...defaultConfig.entities];
    this.logs = [];
    this.maxLogs = 1000;

    // WebSocket clients
    this.wsClients = new Set();

    // Player list tracking
    this.players = [];
    this.playerPollInterval = null;
    this.playerPollDelay = 8000; // 8 seconds

    this.setupMiddleware();
    this.setupRoutes();
    this.setupWebSocket();
    this.setupEventHandlers();
  }

  setupMiddleware() {
    this.app.use(cors());
    this.app.use(express.json());

    // Logging middleware
    this.app.use((req, res, next) => {
      const log = {
        timestamp: new Date().toISOString(),
        method: req.method,
        path: req.path,
        ip: req.ip
      };
      console.log(`[${log.timestamp}] ${log.method} ${log.path}`);
      this.addLog('http', `${log.method} ${log.path}`);
      next();
    });
  }

  setupRoutes() {
    // Health check
    this.app.get('/api/health', (req, res) => {
      res.json({
        status: 'ok',
        rcon: rconClient.isConnected(),
        ollama: 'unknown',
        timestamp: new Date().toISOString()
      });
    });

    // Config routes
    this.app.get('/api/config', (req, res) => {
      res.json(this.config);
    });

    this.app.put('/api/config', (req, res) => {
      this.config = { ...this.config, ...req.body };
      this.broadcastToClients('config', this.config);
      res.json(this.config);
    });

    // Entity routes
    this.app.get('/api/entities', (req, res) => {
      res.json(this.entities);
    });

    this.app.post('/api/entities', (req, res) => {
      const entity = {
        ...req.body,
        id: req.body.id || `entity-${Date.now()}`
      };
      this.entities.push(entity);
      
      // Register with position tracker if it's an NPC with a tag
      if (entity.type === 'npc' && entity.appearance?.entityTag) {
        positionTracker.registerEntity(entity);
      }
      
      this.broadcastToClients('entities', this.entities);
      res.json(entity);
    });

    this.app.put('/api/entities/:id', (req, res) => {
      const index = this.entities.findIndex(e => e.id === req.params.id);
      if (index !== -1) {
        this.entities[index] = { ...this.entities[index], ...req.body };
        
        // Update position tracker with new entity data
        if (this.entities[index].type === 'npc' && this.entities[index].appearance?.entityTag) {
          positionTracker.updateEntity(this.entities[index]);
        }
        
        this.broadcastToClients('entities', this.entities);
        res.json(this.entities[index]);
      } else {
        res.status(404).json({ error: 'Entity not found' });
      }
    });

    this.app.delete('/api/entities/:id', (req, res) => {
      const index = this.entities.findIndex(e => e.id === req.params.id);
      if (index !== -1) {
        const entity = this.entities[index];
        
        // Unregister from position tracker
        positionTracker.unregisterEntity(entity.id);
        
        this.entities.splice(index, 1);
        this.broadcastToClients('entities', this.entities);
        res.json({ success: true });
      } else {
        res.status(404).json({ error: 'Entity not found' });
      }
    });

    // Logs route
    this.app.get('/api/logs', (req, res) => {
      const limit = parseInt(req.query.limit) || 100;
      res.json(this.logs.slice(-limit));
    });

    // RCON command route
    this.app.post('/api/rcon/command', async (req, res) => {
      const { command } = req.body;

      if (!command) {
        return res.status(400).json({ error: 'Command is required' });
      }

      const result = await rconClient.sendCommand(command);
      this.addLog('rcon', `Command: ${command} - ${result.success ? 'Success' : 'Failed'}`);

      res.json(result);
    });

    // Server status
    this.app.get('/api/server/status', async (req, res) => {
      const status = {
        rcon: rconClient.getStatus(),
        chatMonitor: chatMonitor.getStats(),
        conversationQueue: conversationQueue.getStats(),
        stateFetcher: stateFetcher.getStats(),
        entities: this.entities.length,
        timestamp: new Date().toISOString()
      };

      res.json(status);
    });

    // Command validation
    this.app.post('/api/commands/validate', (req, res) => {
      const { command, entityId } = req.body;

      if (!command || !entityId) {
        return res.status(400).json({ error: 'Command and entityId are required' });
      }

      const entity = this.entities.find(e => e.id === entityId);
      if (!entity) {
        return res.status(404).json({ error: 'Entity not found' });
      }

      const validation = commandValidator.validateCommand(command, entity);
      res.json(validation);
    });

    // Get chat history
    this.app.get('/api/chat/history', (req, res) => {
      const limit = parseInt(req.query.limit) || 50;
      const excludeAI = req.query.excludeAI === 'true';

      const history = chatMonitor.getChatHistory(limit, { excludeAI });
      res.json(history);
    });

    // Search chat history
    this.app.get('/api/chat/search', (req, res) => {
      const { query, limit } = req.query;

      if (!query) {
        return res.status(400).json({ error: 'Query is required' });
      }

      const results = chatMonitor.searchHistory(query, parseInt(limit) || 20);
      res.json(results);
    });

    // Get state
    this.app.get('/api/state/player/:playerName', async (req, res) => {
      const { playerName } = req.params;
      const fields = req.query.fields ? req.query.fields.split(',') : ['health', 'position'];

      const state = await stateFetcher.getPlayerState(playerName, fields);
      res.json(state);
    });

    this.app.get('/api/state/world', async (req, res) => {
      const fields = req.query.fields ? req.query.fields.split(',') : ['time', 'weather'];

      const state = await stateFetcher.getWorldState(fields);
      res.json(state);
    });

    // Ollama routes
    this.app.get('/api/ollama/models', async (req, res) => {
      const result = await ollamaClient.listModels();
      res.json(result);
    });

    this.app.get('/api/ollama/health', async (req, res) => {
      const result = await ollamaClient.healthCheck();
      res.json(result);
    });
  }

  setupWebSocket() {
    this.wss.on('connection', (ws) => {
      console.log('[WebSocket] Client connected');
      this.wsClients.add(ws);

      // Send initial state
      ws.send(JSON.stringify({
        type: 'connected',
        payload: {
          config: this.config,
          entities: this.entities,
          players: {
            count: this.players.length,
            players: this.players,
            timestamp: new Date().toISOString()
          },
          timestamp: new Date().toISOString()
        }
      }));

      ws.on('message', (message) => {
        try {
          const data = JSON.parse(message);
          this.handleWebSocketMessage(ws, data);
        } catch (error) {
          console.error('[WebSocket] Error parsing message:', error);
        }
      });

      ws.on('close', () => {
        console.log('[WebSocket] Client disconnected');
        this.wsClients.delete(ws);
      });

      ws.on('error', (error) => {
        console.error('[WebSocket] Error:', error);
        this.wsClients.delete(ws);
      });
    });
  }

  handleWebSocketMessage(ws, data) {
    const { type, payload } = data;

    switch (type) {
      case 'config:update':
        this.config = { ...this.config, ...payload };
        this.broadcastToClients('config', this.config);
        break;

      case 'entity:update':
        const index = this.entities.findIndex(e => e.id === payload.id);
        if (index !== -1) {
          this.entities[index] = { ...this.entities[index], ...payload };
          this.broadcastToClients('entities', this.entities);
        }
        break;

      default:
        console.warn('[WebSocket] Unknown message type:', type);
    }
  }

  broadcastToClients(type, payload) {
    const message = JSON.stringify({ type, payload });

    for (const client of this.wsClients) {
      if (client.readyState === 1) { // OPEN
        client.send(message);
      }
    }
  }

  setupEventHandlers() {
    // Chat monitor events
    chatMonitor.on('chat', async (chatMessage) => {
      this.addLog('chat', `<${chatMessage.player}> ${chatMessage.message}`);
      this.broadcastToClients('chat', chatMessage);

      // Check which entities should respond
      for (const entity of this.entities) {
        const shouldRespond = await chatMonitor.shouldEntityRespond(chatMessage, entity);

        if (shouldRespond) {
          console.log(`[MCPServer] Entity "${entity.name}" should respond to message from ${chatMessage.player}`);

          // Add to conversation queue
          conversationQueue.enqueue(entity.id, chatMessage);

          // Process if not already processing
          this.processEntityQueue(entity);
        }
      }
    });

    chatMonitor.on('player_join', (message) => {
      this.addLog('server', message.raw);
      this.broadcastToClients('player_join', message);
    });

    chatMonitor.on('player_leave', (message) => {
      this.addLog('server', message.raw);
      this.broadcastToClients('player_leave', message);
    });

    chatMonitor.on('ai_entity_spawn', (message) => {
      this.handleAIEntitySpawn(message);
    });

    // RCON events
    rconClient.on('connected', () => {
      this.addLog('rcon', 'Connected to Minecraft server');
      this.broadcastToClients('status', { rcon: 'connected' });
    });

    rconClient.on('disconnected', () => {
      this.addLog('rcon', 'Disconnected from Minecraft server');
      this.broadcastToClients('status', { rcon: 'disconnected' });
    });

    rconClient.on('error', (error) => {
      this.addLog('error', `RCON error: ${error.message}`);
    });
  }

  async processEntityQueue(entity) {
    if (conversationQueue.isProcessing(entity.id)) {
      return;
    }

    try {
      await conversationQueue.processNext(entity.id, async (message) => {
        return await this.handleEntityMessage(entity, message);
      });
    } catch (error) {
      console.error(`[MCPServer] Error processing queue for entity "${entity.name}":`, error);
      this.addLog('error', `Entity ${entity.name} processing error: ${error.message}`);
    }
  }

  /**
   * Split long messages into chunks that fit within Minecraft's chat limit
   * Minecraft has a 256-character limit for chat messages
   */
  splitMessageForMinecraft(message, maxLength = 200) {
    // Leave room for formatting like "<EntityName> " prefix
    if (message.length <= maxLength) {
      return [message];
    }

    const chunks = [];
    let currentChunk = '';
    const words = message.split(' ');

    for (const word of words) {
      // If adding this word would exceed limit, save current chunk and start new one
      if ((currentChunk + word).length > maxLength) {
        if (currentChunk.length > 0) {
          chunks.push(currentChunk.trim());
          currentChunk = '';
        }
        
        // If a single word is longer than maxLength, split it
        if (word.length > maxLength) {
          for (let i = 0; i < word.length; i += maxLength) {
            chunks.push(word.substring(i, i + maxLength));
          }
        } else {
          currentChunk = word + ' ';
        }
      } else {
        currentChunk += word + ' ';
      }
    }

    if (currentChunk.trim().length > 0) {
      chunks.push(currentChunk.trim());
    }

    return chunks;
  }

  async handleEntityMessage(entity, message) {
    console.log(`[MCPServer] Processing message for entity "${entity.name}"`);

    // Add user message to history
    conversationQueue.addToHistory(
      entity.id,
      'user',
      `${message.player}: ${message.message}`,
      { player: message.player }
    );

    // Build context
    const context = conversationQueue.buildFullContext(entity, 20);

    // Add current state information if entity has access
    if (entity.knowledge?.canAccessPlayerState || entity.knowledge?.canAccessWorldState) {
      const state = await stateFetcher.getComprehensiveState(entity, message.player);

      context.push({
        role: 'system',
        content: `Current game state: ${JSON.stringify(state)}`
      });
    }

    // LOG REQUEST TO ollama-log.txt
    ollamaLogger.logRequest(entity, context, {
      model: entity.llm?.model,
      temperature: entity.llm?.temperature || 0.7
    });

    // Get LLM response
    console.log(`[MCPServer] Sending to Ollama (model: ${entity.llm?.model || 'default'})...`);
    const llmResult = await ollamaClient.chat(context, {
      model: entity.llm?.model,
      temperature: entity.llm?.temperature || 0.7
    });

    // LOG RESPONSE TO ollama-log.txt
    ollamaLogger.logResponse(entity, llmResult, llmResult.durationMs || 0);

    if (!llmResult.success) {
      ollamaLogger.logError(entity, new Error(llmResult.error));
      throw new Error(`LLM error: ${llmResult.error}`);
    }

    const llmResponse = llmResult.message.content;
    console.log(`[MCPServer] LLM response: ${llmResponse}`);

    // Add assistant response to history
    conversationQueue.addToHistory(entity.id, 'assistant', llmResponse);

    // Parse response
    const parsed = llmParser.parseAndValidate(llmResponse);
    console.log(`[MCPServer] Parsed: ${parsed.chat.length} chat, ${parsed.commands.length} commands`);

    // LOG PARSED TO ollama-log.txt
    ollamaLogger.logParsed(entity, parsed);

    // Execute commands (with validation)
    for (const cmd of parsed.commands) {
      const validation = commandValidator.validateCommand(cmd.command, entity);

      if (validation.valid) {
        let actualCommand = cmd.command.replace(/^\//, '');

        // Convert /say commands to tellraw to avoid [Rcon] prefix
        if (actualCommand.startsWith('say ')) {
          const message = actualCommand.substring(4).trim(); // Remove 'say ' prefix
          const target = message.match(/^(@[aprs]|@[aprs]\[[^\]]+\]|\w+)/)?.[0] || '@a';
          const text = message.substring(target.length).trim();

          if (entity.type === 'console') {
            actualCommand = `tellraw ${target} {"text":"<${entity.name}> ${llmParser.escapeMinecraftText(text)}","color":"gold"}`;
          } else {
            actualCommand = `tellraw ${target} {"text":"[AI] <${entity.name}> ${llmParser.escapeMinecraftText(text)}","color":"aqua"}`;
          }
        }

        console.log(`[MCPServer] Executing validated command: ${actualCommand}`);
        const result = await rconClient.sendCommand(actualCommand);

        this.addLog('command', `[${entity.name}] ${cmd.command} - ${result.success ? 'OK' : 'FAILED'}`);
      } else {
        console.warn(`[MCPServer] Command validation failed: ${validation.error}`);
        this.addLog('warning', `[${entity.name}] Command blocked: ${cmd.command} - ${validation.error}`);
      }
    }

    // Send chat messages (only if action != 0)
    // action=0 means entity wants to think/observe silently
    // action=1 (default) means entity wants to speak
    const shouldSpeak = parsed.action !== 0;
    
    if (!shouldSpeak && parsed.chat.length > 0) {
      console.log(`[MCPServer] Entity "${entity.name}" chose not to speak (action=0), suppressing ${parsed.chat.length} chat message(s)`);
      this.addLog('system', `${entity.name} observed silently`);
    }

    for (const chatMsg of parsed.chat) {
      if (!shouldSpeak) {
        // Skip chat output but log internally
        conversationQueue.addToHistory(entity.id, 'assistant', chatMsg, { suppressed: true });
        continue;
      }

      // Check if entity uses chat bubbles or server chat
      const useChatBubble = entity.appearance?.chatBubble && positionTracker.getPosition(entity.id);
      const useServerChat = entity.appearance?.usesServerChat !== false; // Default true
      
      if (useChatBubble) {
        // Display as floating chat bubble above entity
        await chatBubbleManager.displayBubble(entity, chatMsg);
      }
      
      if (useServerChat) {
        // Split long messages to fit within Minecraft's 256-character limit
        const messageChunks = this.splitMessageForMinecraft(chatMsg);
        
        for (let i = 0; i < messageChunks.length; i++) {
          const chunk = messageChunks[i];
          const isFirstChunk = i === 0;
          const isMultipart = messageChunks.length > 1;
          
          let formattedCommand;
          if (entity.type === 'console') {
            // Console messages with proper name display (no [AI] tag, different color)
            const prefix = isFirstChunk ? `<${entity.name}> ` : '  '; // Indent continuation lines
            formattedCommand = `tellraw @a {"text":"${prefix}${llmParser.escapeMinecraftText(chunk)}","color":"gold"}`;
          } else {
            // NPC/AI entity messages with [AI] tag
            const prefix = isFirstChunk ? `[AI] <${entity.name}> ` : '  '; // Indent continuation lines
            formattedCommand = `tellraw @a {"text":"${prefix}${llmParser.escapeMinecraftText(chunk)}","color":"aqua"}`;
          }
          
          const result = await rconClient.sendCommand(formattedCommand);
          
          // Small delay between chunks for readability
          if (isMultipart && i < messageChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        if (messageChunks.length > 1) {
          console.log(`[MCPServer] Split long message into ${messageChunks.length} chunks`);
        }
      }

      this.addLog('chat', `[${entity.name}] ${chatMsg}`);
      this.broadcastToClients('entity_response', {
        entity: entity.name,
        message: chatMsg
      });

      // FEEDBACK LOOP: Inject AI's message back into chat system immediately
      // This allows other AI entities to hear it without waiting for log file polling
      const feedbackMessage = {
        type: 'chat',
        player: `[AI] ${entity.name}`,
        message: chatMsg,
        timestamp: new Date().toISOString(),
        raw: `<[AI] ${entity.name}> ${chatMsg}`,
        isAI: true,
        sourceEntityId: entity.id // Track source to prevent self-response
      };

      // Log feedback to ollama-log.txt
      ollamaLogger.logFeedback(entity, chatMsg);

      // Emit the message to chat monitor (slight delay to avoid same-entity re-processing)
      setImmediate(() => {
        console.log(`[MCPServer] FEEDBACK LOOP: Injecting "${entity.name}" message back into system for other AIs`);
        chatMonitor.emit('chat', feedbackMessage);
      });
    }

    ollamaLogger.separator();

    return {
      success: true,
      parsed,
      llmResult
    };
  }

  handleAIEntitySpawn(message) {
    const { entityName } = message;

    // Check if entity already exists
    const existingEntity = this.entities.find(e => e.name === entityName);
    if (existingEntity) {
      console.log(`[MCPServer] Entity "${entityName}" already exists, skipping auto-creation`);
      return;
    }

    // Create new entity config with reasonable defaults
    const newEntity = {
      id: `ai-${entityName.toLowerCase()}-${Date.now()}`,
      name: entityName,
      type: 'npc',
      enabled: true,
      permissions: {
        level: 'environment',
        whitelistedCommands: ['say', 'tell', 'tellraw', 'me'],
        blacklistedCommands: ['stop', 'kick', 'ban', 'op', 'deop', 'whitelist'],
        canExecuteCommands: true
      },
      knowledge: {
        canAccessPlayerState: ['health', 'position'],
        canAccessWorldState: ['time', 'weather'],
        proximityRequired: true,
        maxProximity: 10,
        chatFilters: {
          respondToPlayers: true,
          respondToAI: false,
          requiresMention: false,
          proximityRequired: true,
          maxProximity: 10
        }
      },
      personality: {
        characterContext: `You are ${entityName}, an AI entity in a Minecraft world. You can chat with players and perform basic commands. Be helpful and friendly!`,
        conversationHistoryLimit: 20,
        useSummarization: false
      },
      llm: {
        model: 'qwen2.5:14b-instruct',
        enabled: true,
        temperature: 0.7
      },
      appearance: {
        spawnCommand: null,
        chatBubble: false,
        usesServerChat: true,
        position: null
      },
      mcpTools: {
        minecraft_send_message: true,
        minecraft_run_command: true,
        minecraft_get_chat_history: true,
        minecraft_search_history: false,
        minecraft_get_player_info: true,
        minecraft_get_server_status: false
      }
    };

    // Add entity to the list
    this.entities.push(newEntity);

    // Broadcast the new entity to all clients
    this.broadcastToClients('entities', this.entities);
    this.broadcastToClients('entity_created', newEntity);

    // Log the creation
    this.addLog('server', `Auto-created AI entity: ${entityName}`);
    console.log(`[MCPServer] Auto-created AI entity: ${entityName} (ID: ${newEntity.id})`);
  }

  addLog(type, message) {
    const log = {
      type,
      message,
      timestamp: new Date().toISOString()
    };

    this.logs.push(log);

    // Limit log size
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Broadcast to WebSocket clients
    this.broadcastToClients('log', log);
  }

  async pollPlayerList() {
    try {
      const result = await rconClient.sendCommand('list');

      if (result.success && result.response) {
        // Parse player list from response
        // Expected format: "There are X of Y max: player1, player2, player3"
        const players = this.parsePlayerList(result.response);

        // Only broadcast if the list has changed
        if (JSON.stringify(players) !== JSON.stringify(this.players)) {
          this.players = players;
          this.broadcastToClients('players', {
            count: players.length,
            players: players,
            timestamp: new Date().toISOString()
          });

          console.log(`[MCPServer] Player list updated: ${players.length} online`);
        }
      }
    } catch (error) {
      console.error('[MCPServer] Error polling player list:', error);
    }
  }

  parsePlayerList(response) {
    try {
      // Remove color codes and formatting
      const cleanResponse = response.replace(/§[0-9a-fk-or]/gi, '');

      // Try to match player names after the colon
      // Format: "There are X of a max of Y players online: name1, name2, name3"
      const match = cleanResponse.match(/:\s*(.+)$/);

      if (match && match[1].trim()) {
        // Split by comma and clean up whitespace
        const players = match[1]
          .split(',')
          .map(name => name.trim())
          .filter(name => name.length > 0);

        return players;
      }

      return [];
    } catch (error) {
      console.error('[MCPServer] Error parsing player list:', error);
      return [];
    }
  }

  startPlayerPolling() {
    // Clear any existing interval
    if (this.playerPollInterval) {
      clearInterval(this.playerPollInterval);
    }

    // Start polling immediately
    this.pollPlayerList();

    // Then poll at regular intervals
    this.playerPollInterval = setInterval(() => {
      this.pollPlayerList();
    }, this.playerPollDelay);

    console.log(`[MCPServer] Player polling started (every ${this.playerPollDelay}ms)`);
  }

  stopPlayerPolling() {
    if (this.playerPollInterval) {
      clearInterval(this.playerPollInterval);
      this.playerPollInterval = null;
      console.log('[MCPServer] Player polling stopped');
    }
  }

  start() {
    // Start chat monitor
    chatMonitor.start();

    // Start player polling
    this.startPlayerPolling();

    // Start position tracker
    positionTracker.start();
    
    // Start chat bubble cleanup
    chatBubbleManager.startCleanup();
    
    // Register existing entities with position tracker
    this.entities.forEach(entity => {
      if (entity.type === 'npc' && entity.appearance?.entityTag) {
        positionTracker.registerEntity(entity);
      }
    });

    // Start server
    this.server.listen(this.port, () => {
      console.log(`
========================================
MCP Server Started
========================================
HTTP Server: http://localhost:${this.port}
WebSocket: ws://localhost:${this.port}
========================================
      `);

      this.addLog('server', `MCP Server started on port ${this.port}`);
    });
  }

  stop() {
    chatMonitor.stop();
    this.stopPlayerPolling();
    positionTracker.stop();
    chatBubbleManager.stopCleanup();
    rconClient.disconnect();
    this.server.close();
    console.log('[MCPServer] Server stopped');
  }
}

// Create and start server
const server = new MCPServer();
server.start();

// Handle shutdown
process.on('SIGINT', () => {
  console.log('\n[MCPServer] Shutting down...');
  server.stop();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n[MCPServer] Shutting down...');
  server.stop();
  process.exit(0);
});

export { MCPServer };
