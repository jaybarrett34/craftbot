# Craftbot MCP Architecture Documentation

This document provides a comprehensive overview of the Craftbot MCP system architecture, components, data flow, and implementation details.

## Table of Contents

1. [System Overview](#system-overview)
2. [Architecture Diagram](#architecture-diagram)
3. [Component Details](#component-details)
4. [Data Flow](#data-flow)
5. [Configuration System](#configuration-system)
6. [API Endpoints](#api-endpoints)
7. [WebSocket Protocol](#websocket-protocol)
8. [Security Model](#security-model)
9. [Troubleshooting](#troubleshooting)

---

## System Overview

Craftbot MCP is an AI-powered Minecraft server management system that enables AI entities (NPCs and console bots) to interact with players, execute commands, and respond contextually using Large Language Models.

### Key Features

- **AI-Driven Entities:** Configure multiple AI entities with different personalities, permissions, and capabilities
- **RCON Integration:** Real-time command execution via Minecraft's Remote Console
- **LLM Responses:** Context-aware responses using Ollama (llama2, llama3, mixtral, etc.)
- **Permission System:** Granular command permissions (admin, mod, environment, readonly)
- **Real-Time Monitoring:** Live log viewer with WebSocket updates
- **Web-Based Configuration:** Modern React frontend for entity and server management
- **RAG Support:** Optional vector database integration for conversation history

### Technology Stack

**Frontend:**
- React 18
- Vite
- Three.js (for visual effects)
- GSAP (animations)
- WebSocket API

**Backend:**
- Node.js
- Express.js
- WebSocket (ws package)
- RCON Client (rcon-client)

**AI/ML:**
- Ollama (local LLM inference)
- ChromaDB (optional, for RAG)

**Infrastructure:**
- Minecraft Fabric Server (1.20.1+)
- RCON (Remote Console)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                         Minecraft Server                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐          │
│  │   Players    │  │  AI NPCs     │  │   Console    │          │
│  │  (Steve,     │  │  ([AI] Bob,  │  │   Commands   │          │
│  │   Alex)      │  │   [AI] Alice)│  │              │          │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘          │
│         │                 │                  │                   │
│         └────────┬────────┴──────────────────┘                   │
│                  │                                                │
│         ┌────────▼────────┐                                      │
│         │  Chat System    │                                      │
│         │  & Log Files    │                                      │
│         └────────┬────────┘                                      │
│                  │                                                │
│         ┌────────▼────────┐                                      │
│         │  RCON Service   │◄──────────┐                          │
│         │  (Port 25575)   │           │                          │
│         └─────────────────┘           │                          │
└───────────────────────────────────────┼──────────────────────────┘
                                        │
                                        │ RCON Protocol
                                        │ (Commands In, Responses Out)
                                        │
┌───────────────────────────────────────┼──────────────────────────┐
│                    Craftbot MCP Backend                           │
│                    (Node.js + Express)                            │
│                                        │                          │
│  ┌─────────────────────────────────────▼───────────────────────┐ │
│  │                  RCON Client Manager                         │ │
│  │  • Connection management                                     │ │
│  │  • Auto-reconnection                                         │ │
│  │  • Command queue                                             │ │
│  └─────────────┬────────────────────────────────────────────────┘ │
│                │                                                   │
│  ┌─────────────▼────────────────────────────────────────────────┐ │
│  │                  Log Monitor Service                          │ │
│  │  • Tail Minecraft log files                                  │ │
│  │  • Parse chat messages                                       │ │
│  │  • Detect AI entity mentions                                 │ │
│  │  • Extract player/world state                                │ │
│  └─────────────┬────────────────────────────────────────────────┘ │
│                │                                                   │
│  ┌─────────────▼────────────────────────────────────────────────┐ │
│  │             Conversation Queue Manager                        │ │
│  │  • Queue incoming messages                                   │ │
│  │  • Route to appropriate entities                             │ │
│  │  • Handle proximity detection                                │ │
│  │  • Manage conversation context                               │ │
│  └─────────────┬────────────────────────────────────────────────┘ │
│                │                                                   │
│  ┌─────────────▼────────────────────────────────────────────────┐ │
│  │               Entity Manager                                  │ │
│  │  • Load entity configurations                                │ │
│  │  • Manage entity state                                       │ │
│  │  • Build LLM context                                         │ │
│  │  • Validate permissions                                      │ │
│  └─────────────┬────────────────────────────────────────────────┘ │
│                │                                                   │
│                ├──────────────┐                                   │
│                │              │                                   │
│  ┌─────────────▼──────┐  ┌───▼────────────────────────────────┐ │
│  │  LLM Integration    │  │  Command Validator                 │ │
│  │  • Ollama API       │  │  • Permission checks               │ │
│  │  • Prompt builder   │  │  • Whitelist/blacklist             │ │
│  │  • XML parser       │  │  • Injection prevention            │ │
│  └─────────────┬───────┘  │  • Rate limiting                   │ │
│                │          └───┬────────────────────────────────┘ │
│                │              │                                   │
│                │              │                                   │
│  ┌─────────────▼──────────────▼───────────────────────────────┐ │
│  │              Response Handler                                │ │
│  │  • Execute validated commands                                │ │
│  │  • Send chat messages                                        │ │
│  │  • Handle silence tags                                       │ │
│  │  • Log all actions                                           │ │
│  └──────────────────────────────────────────────────────────────┘ │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐ │
│  │                 REST API + WebSocket Server                   │ │
│  │  • /api/config                                               │ │
│  │  • /api/entities                                             │ │
│  │  • /api/logs                                                 │ │
│  │  • /api/rcon/command                                         │ │
│  │  • ws:// (real-time updates)                                 │ │
│  └─────────────┬────────────────────────────────────────────────┘ │
└────────────────┼──────────────────────────────────────────────────┘
                 │
                 │ HTTP/WebSocket
                 │
┌────────────────▼──────────────────────────────────────────────────┐
│                      Frontend (React + Vite)                       │
│                                                                    │
│  ┌────────────────────┐  ┌────────────────────┐                  │
│  │   Log Viewer       │  │  Config Manager    │                  │
│  │  • Real-time logs  │  │  • Entity editor   │                  │
│  │  • Filtering       │  │  • Permission UI   │                  │
│  │  • Infinite scroll │  │  • Server settings │                  │
│  └────────────────────┘  └────────────────────┘                  │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           WebSocket Manager                                  │ │
│  │  • Auto-reconnection                                         │ │
│  │  • Event listeners                                           │ │
│  │  • State synchronization                                     │ │
│  └─────────────────────────────────────────────────────────────┘ │
│                                                                    │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │           API Service Layer                                  │ │
│  │  • HTTP requests                                             │ │
│  │  • Error handling                                            │ │
│  │  • Response parsing                                          │ │
│  └─────────────────────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────┘

                 ┌────────────────────┐
                 │   Ollama Service   │
                 │  (Port 11434)      │
                 │  • LLM inference   │
                 │  • Model management│
                 └────────────────────┘

                 ┌────────────────────┐
                 │  ChromaDB          │
                 │  (Port 8000)       │
                 │  • Vector storage  │
                 │  • RAG queries     │
                 └────────────────────┘
```

---

## Component Details

### 1. RCON Client Manager

**Purpose:** Manages communication between the MCP backend and Minecraft server.

**Responsibilities:**
- Establish and maintain RCON connection
- Send commands to Minecraft
- Receive command responses
- Auto-reconnect on disconnect
- Queue commands during disconnection

**Key Files:**
- `src/services/rconClient.js`

**Configuration:**
```javascript
{
  rconHost: "localhost",
  rconPort: 25575,
  rconPassword: "your_password",
  autoReconnect: true,
  reconnectDelay: 5000
}
```

**Events:**
- `connected` - RCON connection established
- `disconnected` - Connection lost
- `error` - Connection or command error
- `response` - Command response received

---

### 2. Log Monitor Service

**Purpose:** Monitor Minecraft server logs and detect chat messages, commands, and events.

**Responsibilities:**
- Tail the `latest.log` file
- Parse log entries by level (INFO, WARN, ERROR)
- Detect chat messages (`<Player> message`)
- Extract player join/leave events
- Identify command executions
- Forward relevant entries to conversation queue

**Key Files:**
- `src/services/logMonitor.js`

**Log Patterns:**
```javascript
// Chat message
const chatPattern = /^\[.*\] \[Server thread\/INFO\]: <(.+)> (.+)$/

// Player join
const joinPattern = /^\[.*\] \[Server thread\/INFO\]: (.+) joined the game$/

// Command
const commandPattern = /^\[.*\] \[Server thread\/INFO\]: (.+) issued server command: (.+)$/
```

**Configuration:**
```javascript
{
  logPath: "/path/to/minecraft/logs/latest.log",
  pollInterval: 1000, // Check every 1 second
  encoding: "utf8"
}
```

---

### 3. Conversation Queue Manager

**Purpose:** Process incoming messages and route them to appropriate AI entities.

**Responsibilities:**
- Queue messages for processing
- Determine which entities should respond
- Check proximity requirements
- Manage conversation context
- Prevent duplicate processing
- Handle message deduplication

**Key Files:**
- `src/services/conversationQueue.js`

**Queue Entry Format:**
```javascript
{
  id: "msg_123",
  timestamp: 1234567890,
  sender: "Steve",
  message: "Hello @Bob",
  mentionedEntities: ["npc_bob"],
  location: { x: 100, y: 64, z: 100 },
  context: {
    nearbyPlayers: ["Steve", "Alex"],
    nearbyEntities: ["npc_bob", "npc_alice"],
    worldState: { time: 1000, weather: "clear" }
  }
}
```

**Processing Logic:**
1. Receive message from log monitor
2. Parse mentions and addressees
3. Find entities within perception radius
4. Add to each entity's queue
5. Process sequentially with rate limiting

---

### 4. Entity Manager

**Purpose:** Manage AI entity configurations, state, and behavior.

**Responsibilities:**
- Load entity configurations from config file
- Maintain entity state (position, inventory, context)
- Build LLM prompts with context
- Track conversation history per entity
- Handle entity enable/disable

**Key Files:**
- `src/services/entityManager.js`
- `src/config/defaultConfig.js`

**Entity Configuration Schema:**
```javascript
{
  id: "npc_bob",
  name: "[AI] Bob",
  type: "npc", // console, npc, player
  enabled: true,
  permissions: {
    level: "mod", // readonly, environment, mod, admin
    whitelistedCommands: ["*"],
    blacklistedCommands: ["stop", "ban"],
    canExecuteCommands: true
  },
  knowledge: {
    canAccessPlayerState: ["health", "position", "inventory"],
    canAccessWorldState: ["time", "weather", "entities"],
    proximityRequired: true,
    maxProximity: 10 // blocks, -1 for unlimited
  },
  personality: {
    systemPrompt: "You are a helpful NPC...",
    conversationHistoryLimit: 50,
    useSummarization: true
  },
  llm: {
    model: "llama2",
    enabled: true,
    temperature: 0.7
  },
  appearance: {
    spawnCommand: "/summon villager ...",
    chatBubble: true,
    usesServerChat: false
  },
  mcpTools: {
    minecraft_send_message: true,
    minecraft_run_command: true,
    minecraft_get_chat_history: true,
    minecraft_search_history: true,
    minecraft_get_player_info: true,
    minecraft_get_server_status: true
  }
}
```

---

### 5. LLM Integration

**Purpose:** Generate AI responses using Ollama.

**Responsibilities:**
- Build prompts with context
- Call Ollama API
- Parse XML responses
- Extract speech, commands, and silence tags
- Handle timeouts and errors

**Key Files:**
- `src/services/ollamaClient.js`

**Prompt Template:**
```
You are {entity.name}. {entity.personality.systemPrompt}

Current context:
- Time: {world.time}
- Weather: {world.weather}
- Nearby players: {context.nearbyPlayers}
- Your position: {entity.position}

Player state (if accessible):
- Health: {player.health}
- Gamemode: {player.gamemode}

Recent conversation:
{conversationHistory}

{sender} says: "{message}"

Respond using XML tags:
<speech>Your spoken response</speech>
<command>/minecraft command here</command>
<silence>false</silence>

Rules:
- Use <speech> for chat messages
- Use <command> for Minecraft commands (will be validated)
- Set <silence>true</silence> if you don't want to respond
- Multiple <command> tags are allowed
- Commands must be valid Minecraft syntax
```

**Response Example:**
```xml
<speech>Hello Steve! The weather is lovely today.</speech>
<command>/time set day</command>
<silence>false</silence>
```

**Ollama API Call:**
```javascript
const response = await fetch('http://localhost:11434/api/generate', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    model: 'llama2',
    prompt: prompt,
    stream: false,
    options: {
      temperature: 0.7,
      top_p: 0.9,
      max_tokens: 500
    }
  })
});
```

---

### 6. Command Validator

**Purpose:** Validate and sanitize commands before execution.

**Responsibilities:**
- Check entity permissions
- Enforce whitelist/blacklist
- Prevent command injection
- Rate limiting
- Log security events

**Key Files:**
- `src/services/commandValidator.js`

**Validation Process:**
```javascript
function validateCommand(command, entity) {
  // 1. Check if entity can execute commands
  if (!entity.permissions.canExecuteCommands) {
    return { allowed: false, reason: "No command permissions" };
  }

  // 2. Parse command
  const cmd = command.trim().split(' ')[0].replace('/', '');

  // 3. Check blacklist
  if (entity.permissions.blacklistedCommands.includes(cmd)) {
    logSecurityEvent('BLACKLIST_VIOLATION', entity, command);
    return { allowed: false, reason: "Blacklisted command" };
  }

  // 4. Check whitelist
  const whitelist = entity.permissions.whitelistedCommands;
  if (!whitelist.includes('*') && !whitelist.includes(cmd)) {
    return { allowed: false, reason: "Not in whitelist" };
  }

  // 5. Check permission level
  const requiredLevel = getCommandRequiredLevel(cmd);
  if (!hasPermissionLevel(entity.permissions.level, requiredLevel)) {
    logSecurityEvent('PERMISSION_ESCALATION', entity, command);
    return { allowed: false, reason: "Insufficient permission level" };
  }

  // 6. Sanitize for injection
  if (containsInjectionPatterns(command)) {
    logSecurityEvent('INJECTION_ATTEMPT', entity, command);
    return { allowed: false, reason: "Potential injection detected" };
  }

  // 7. Rate limit check
  if (isRateLimited(entity)) {
    return { allowed: false, reason: "Rate limited" };
  }

  return { allowed: true };
}
```

**Permission Levels:**
```javascript
const PERMISSION_HIERARCHY = {
  readonly: 0,
  environment: 1,
  mod: 2,
  admin: 3
};

const COMMAND_LEVELS = {
  // Readonly: No commands

  // Environment level
  'time': 'environment',
  'weather': 'environment',
  'say': 'environment',

  // Mod level
  'tp': 'mod',
  'teleport': 'mod',
  'give': 'mod',
  'kick': 'mod',
  'gamemode': 'mod',

  // Admin level
  'op': 'admin',
  'deop': 'admin',
  'ban': 'admin',
  'pardon': 'admin',
  'stop': 'admin',
  'whitelist': 'admin'
};
```

**Injection Patterns:**
```javascript
const DANGEROUS_PATTERNS = [
  /&&/,           // Command chaining
  /\|\|/,         // OR operator
  /;/,            // Command separator
  /`.*`/,         // Command substitution
  /\$\(.*\)/,     // Command substitution
  /<\(.*\)/,      // Process substitution
  />\(.*\)/       // Process substitution
];
```

---

### 7. Response Handler

**Purpose:** Execute validated commands and send responses.

**Responsibilities:**
- Execute commands via RCON
- Send chat messages
- Handle silence tag
- Display NPC chat bubbles
- Log all actions

**Key Files:**
- `src/services/responseHandler.js`

**Response Processing:**
```javascript
async function handleResponse(entity, llmResponse) {
  const { speech, commands, silence } = parseXML(llmResponse);

  // Check silence
  if (silence === true) {
    log.info(`${entity.id} chose silence`);
    return;
  }

  // Send speech
  if (speech) {
    if (entity.appearance.chatBubble) {
      await displayChatBubble(entity, speech);
    } else if (entity.appearance.usesServerChat) {
      await sendChatMessage(entity, speech);
    }
  }

  // Execute commands
  for (const command of commands) {
    const validation = validateCommand(command, entity);

    if (validation.allowed) {
      try {
        const result = await executeCommand(command);
        log.info(`Command executed: ${command}`);
      } catch (error) {
        log.error(`Command failed: ${command}`, error);
      }
    } else {
      log.warn(`Command blocked: ${command}. Reason: ${validation.reason}`);
    }
  }
}
```

---

## Data Flow

### Complete Message Flow: Player Chat to AI Response

```
1. Player sends chat message in Minecraft
   └─> "<Steve> Hello @Bob"

2. Minecraft writes to latest.log
   └─> [12:34:56] [Server thread/INFO]: <Steve> Hello @Bob

3. Log Monitor detects new entry
   └─> Parses: sender="Steve", message="Hello @Bob"
   └─> Detects mention: "@Bob"

4. Conversation Queue receives message
   └─> Creates queue entry
   └─> Identifies target entity: npc_bob
   └─> Checks proximity: Steve is 5 blocks from Bob ✓
   └─> Adds to Bob's processing queue

5. Entity Manager processes for Bob
   └─> Loads Bob's configuration
   └─> Builds context:
       • Steve's position, health, gamemode
       • World time, weather
       • Nearby entities
       • Conversation history
   └─> Generates LLM prompt

6. LLM Integration calls Ollama
   └─> POST http://localhost:11434/api/generate
   └─> Receives response with XML

7. XML Parser extracts tags
   └─> <speech>Hello Steve! How are you?</speech>
   └─> <command>/give Steve diamond 1</command>
   └─> <silence>false</silence>

8. Command Validator checks permission
   └─> Bob has "mod" level ✓
   └─> /give is allowed ✓
   └─> Not blacklisted ✓
   └─> No injection detected ✓
   └─> Validation passes

9. Response Handler executes
   └─> Sends speech via chat or bubble
   └─> Executes command via RCON

10. RCON Client sends to Minecraft
    └─> /say [AI] Bob: Hello Steve! How are you?
    └─> /give Steve diamond 1

11. Minecraft executes commands
    └─> Chat message appears
    └─> Steve receives diamond

12. WebSocket broadcasts events to frontend
    └─> New log entries
    └─> Command execution status

13. Frontend displays in real-time
    └─> Log Viewer shows conversation
    └─> Entity status updated
```

**Timing Diagram:**
```
Time (ms)    Event
----------   --------------------------------------------------
0            Player sends chat message
100          Log file updated
200          Log monitor detects entry
300          Message queued
500          Entity context built
600          Ollama API called
3000         Ollama responds (2.4s generation time)
3100         XML parsed
3150         Commands validated
3200         Commands executed via RCON
3300         Minecraft processes commands
3400         Response appears in chat
3500         WebSocket broadcasts to frontend
3600         Frontend updates display
```

---

## Configuration System

### Configuration File Locations

1. **Main Config:** `config.json` (runtime, overrides defaults)
2. **Default Config:** `src/config/defaultConfig.js`
3. **Environment:** `.env` (secrets and paths)

### Configuration Hierarchy

```
.env (lowest priority, secrets only)
  ↓
defaultConfig.js (defaults)
  ↓
config.json (user overrides)
  ↓
Runtime changes via API (highest priority, not persisted)
```

### Example Complete Configuration

```json
{
  "entities": [
    {
      "id": "console",
      "name": "Server Console",
      "type": "console",
      "enabled": true,
      "permissions": {
        "level": "admin",
        "whitelistedCommands": ["*"],
        "blacklistedCommands": []
      },
      "knowledge": {
        "canAccessPlayerState": ["health", "position", "inventory", "gamemode"],
        "canAccessWorldState": ["time", "weather", "entities"],
        "proximityRequired": false,
        "maxProximity": null
      },
      "personality": {
        "systemPrompt": "You are the Minecraft server console...",
        "conversationHistoryLimit": 50
      },
      "llm": {
        "model": "llama2",
        "enabled": true,
        "temperature": 0.3
      }
    }
  ],
  "server": {
    "rconHost": "localhost",
    "rconPort": 25575,
    "rconPassword": "${RCON_PASSWORD}",
    "logPath": "/path/to/logs/latest.log",
    "autoReconnect": true,
    "reconnectDelay": 5000
  },
  "rag": {
    "enabled": false,
    "chromadbUrl": "http://localhost:8000",
    "collectionName": "minecraft_chat_history",
    "embeddingModel": "all-MiniLM-L6-v2",
    "maxResults": 10
  },
  "ollama": {
    "baseUrl": "http://localhost:11434",
    "defaultModel": "llama2",
    "timeout": 30000
  },
  "logging": {
    "level": "info",
    "file": "craftbot.log",
    "console": true
  },
  "performance": {
    "maxQueueSize": 100,
    "commandRateLimit": 10,
    "rateLimitWindow": 60000
  }
}
```

---

## API Endpoints

### REST API

Base URL: `http://localhost:3000/api`

#### GET /config
Get current configuration.

**Response:**
```json
{
  "entities": [...],
  "server": {...},
  "ollama": {...}
}
```

#### PUT /config
Update configuration.

**Request Body:**
```json
{
  "entities": [...],
  "server": {...}
}
```

**Response:**
```json
{
  "success": true,
  "config": {...}
}
```

#### GET /entities
Get all entities.

**Response:**
```json
[
  {
    "id": "console",
    "name": "Server Console",
    "type": "console",
    "enabled": true,
    ...
  }
]
```

#### POST /entities
Create new entity.

**Request Body:**
```json
{
  "id": "npc_new",
  "name": "[AI] NewNPC",
  ...
}
```

#### PUT /entities/:id
Update entity.

**Request Body:**
```json
{
  "enabled": false,
  "permissions": {...}
}
```

#### DELETE /entities/:id
Delete entity.

**Response:**
```json
{
  "success": true
}
```

#### GET /logs
Get recent logs.

**Query Parameters:**
- `limit` (default: 100)
- `level` (INFO, WARN, ERROR)
- `source` (Server, Chat, RCON, etc.)

**Response:**
```json
[
  {
    "id": 1,
    "timestamp": "2025-10-01T12:34:56.789Z",
    "level": "INFO",
    "message": "<Steve> Hello world",
    "source": "Chat"
  }
]
```

#### POST /rcon/command
Execute RCON command (requires authentication).

**Request Body:**
```json
{
  "command": "/list"
}
```

**Response:**
```json
{
  "success": true,
  "output": "There are 2/20 players online: Steve, Alex"
}
```

#### GET /server/status
Get server status.

**Response:**
```json
{
  "online": true,
  "players": 2,
  "maxPlayers": 20,
  "version": "1.20.1",
  "tps": 19.8,
  "rconConnected": true,
  "ollamaConnected": true
}
```

#### POST /commands/validate
Validate command permissions.

**Request Body:**
```json
{
  "command": "/give Steve diamond 64",
  "entityId": "npc_bob"
}
```

**Response:**
```json
{
  "allowed": true,
  "reason": null
}
```
OR
```json
{
  "allowed": false,
  "reason": "Insufficient permission level"
}
```

---

## WebSocket Protocol

### Connection

```javascript
const ws = new WebSocket('ws://localhost:3000');
```

### Message Format

All messages are JSON with `type` and `payload`:

```json
{
  "type": "log",
  "payload": {
    "id": 123,
    "timestamp": "2025-10-01T12:34:56.789Z",
    "level": "INFO",
    "message": "<Steve> Hello",
    "source": "Chat"
  }
}
```

### Message Types

#### Server → Client

**`log`** - New log entry
```json
{
  "type": "log",
  "payload": { /* log entry */ }
}
```

**`config`** - Configuration updated
```json
{
  "type": "config",
  "payload": { /* full config */ }
}
```

**`status`** - Server status update
```json
{
  "type": "status",
  "payload": {
    "rconConnected": true,
    "players": 3,
    "tps": 20.0
  }
}
```

**`entity:updated`** - Entity state changed
```json
{
  "type": "entity:updated",
  "payload": {
    "id": "npc_bob",
    "enabled": false
  }
}
```

#### Client → Server

**`config:update`** - Request config update
```json
{
  "type": "config:update",
  "payload": { /* config changes */ }
}
```

**`entity:toggle`** - Enable/disable entity
```json
{
  "type": "entity:toggle",
  "payload": {
    "id": "npc_bob",
    "enabled": true
  }
}
```

**`logs:subscribe`** - Subscribe to log stream
```json
{
  "type": "logs:subscribe",
  "payload": {
    "level": "INFO",
    "source": "Chat"
  }
}
```

### Reconnection

Frontend automatically reconnects with exponential backoff:

```javascript
reconnectDelay = Math.min(
  reconnectDelay * 1.5,
  maxReconnectDelay
);
```

---

## Security Model

### Threat Model

**Protected Against:**
- Command injection via chat
- Permission escalation
- RCON password exposure
- Unauthorized API access
- XSS in frontend
- DoS via message flooding

**Out of Scope:**
- Physical server access
- Minecraft client mods
- Network-level attacks

### Security Layers

#### 1. Command Validation
- Whitelist/blacklist enforcement
- Permission level checks
- Injection pattern detection
- Rate limiting

#### 2. Configuration Security
- `.env` file not committed to git
- RCON password stored in environment
- Config changes logged
- Admin authentication required (if enabled)

#### 3. API Security
- CORS configured
- Rate limiting on endpoints
- Input validation
- SQL injection N/A (no database)

#### 4. Frontend Security
- XSS prevention via React
- Content Security Policy headers
- No eval() or innerHTML
- Sanitized user input

### Security Best Practices

1. **Use strong RCON password**
   - At least 16 characters
   - Random alphanumeric + symbols
   - Don't reuse passwords

2. **Bind RCON to localhost**
   - `rcon.bind=127.0.0.1` in server.properties
   - Only MCP backend can connect

3. **Limit entity permissions**
   - Start with readonly/environment
   - Only grant mod/admin when necessary
   - Use blacklists for dangerous commands

4. **Monitor security logs**
   - Review `craftbot.log` regularly
   - Look for `[SECURITY]` events
   - Set up alerts for escalation attempts

5. **Keep dependencies updated**
   - Run `npm audit` regularly
   - Update Ollama and models
   - Patch Minecraft server

---

## Troubleshooting

### RCON Connection Issues

**Symptom:** Backend logs "RCON connection failed"

**Solutions:**
1. Verify RCON enabled in `server.properties`:
   ```properties
   enable-rcon=true
   rcon.port=25575
   rcon.password=your_password
   ```

2. Check password matches `.env`:
   ```
   RCON_PASSWORD=your_password
   ```

3. Test RCON manually:
   ```bash
   npm install -g rcon-cli
   rcon -H localhost -p 25575 -P your_password "list"
   ```

4. Check Minecraft logs for RCON errors

5. Verify no firewall blocking port 25575

---

### Ollama Not Responding

**Symptom:** LLM requests timeout or fail

**Solutions:**
1. Check Ollama is running:
   ```bash
   curl http://localhost:11434/api/tags
   ```

2. Verify model is installed:
   ```bash
   ollama list
   ```

3. Pull model if missing:
   ```bash
   ollama pull llama2
   ```

4. Check Ollama logs:
   ```bash
   # macOS/Linux
   journalctl -u ollama

   # Or check system logs
   tail -f /var/log/ollama.log
   ```

5. Restart Ollama:
   ```bash
   ollama serve
   ```

---

### No Logs Appearing in Frontend

**Symptom:** Log Viewer is empty

**Solutions:**
1. Check backend is running:
   ```bash
   curl http://localhost:3000/api/logs
   ```

2. Verify WebSocket connection:
   - Open browser DevTools → Network → WS
   - Should see connection to `ws://localhost:3000`

3. Check `MC_LOG_PATH` in `.env`:
   ```
   MC_LOG_PATH=/path/to/minecraft/logs/latest.log
   ```

4. Verify file exists and is readable:
   ```bash
   tail -f /path/to/minecraft/logs/latest.log
   ```

5. Check file permissions:
   ```bash
   ls -la /path/to/minecraft/logs/latest.log
   chmod 644 /path/to/minecraft/logs/latest.log
   ```

---

### AI Not Responding

**Symptom:** Entity sees message but doesn't respond

**Solutions:**
1. Check entity is enabled:
   ```json
   {
     "enabled": true,
     "llm": { "enabled": true }
   }
   ```

2. Verify proximity requirements:
   - Stand closer to NPC
   - Or set `proximityRequired: false`

3. Check backend logs for errors:
   ```bash
   tail -f logs/backend.log
   ```

4. Test Ollama directly:
   ```bash
   ollama run llama2 "Hello, respond with valid XML"
   ```

5. Increase timeout:
   ```json
   {
     "ollama": {
       "timeout": 60000
     }
   }
   ```

6. Check entity uses `<silence>false</silence>`:
   - Entity might be choosing silence
   - Review system prompt

---

### Commands Not Executing

**Symptom:** Commands blocked or fail

**Solutions:**
1. Check entity permissions:
   ```json
   {
     "permissions": {
       "level": "mod",
       "whitelistedCommands": ["*"],
       "blacklistedCommands": []
     }
   }
   ```

2. Review backend logs for validation errors:
   ```
   [WARN] Command blocked: /give. Reason: Not in whitelist
   ```

3. Test command manually via RCON:
   ```bash
   rcon -H localhost -p 25575 -P password "/give Steve diamond 1"
   ```

4. Check command syntax is valid Minecraft format

5. Verify RCON connection is active

---

### High Memory Usage

**Symptom:** Backend uses excessive RAM

**Solutions:**
1. Limit conversation history:
   ```json
   {
     "personality": {
       "conversationHistoryLimit": 20
     }
   }
   ```

2. Reduce log retention:
   ```javascript
   if (logs.length > 100) {
     logs = logs.slice(-100);
   }
   ```

3. Disable unused entities

4. Monitor with:
   ```bash
   htop
   # Or
   ps aux | grep node
   ```

5. Restart backend periodically

---

### Performance Issues

**Symptom:** Slow responses or lag

**Solutions:**
1. Use faster LLM model:
   ```json
   {
     "llm": {
       "model": "llama3.2"
     }
   }
   ```

2. Reduce temperature for faster inference:
   ```json
   {
     "llm": {
       "temperature": 0.2
     }
   }
   ```

3. Increase rate limiting:
   ```json
   {
     "performance": {
       "commandRateLimit": 5
     }
   }
   ```

4. Check Minecraft server TPS:
   ```
   /forge tps
   ```

5. Optimize Ollama:
   - Close other apps
   - Use GPU acceleration (if available)
   - Increase Ollama RAM allocation

---

## Performance Metrics

### Expected Performance

**Latency:**
- Log detection: < 200ms
- Message queuing: < 100ms
- LLM response: 1-5 seconds (model dependent)
- Command execution: < 500ms
- Total player → response: 2-6 seconds

**Throughput:**
- Messages per minute: 60+
- Concurrent entities: 10+
- Concurrent players: 20+

**Resource Usage:**
- Backend RAM: 100-300 MB
- Frontend RAM: 50-100 MB
- Ollama RAM: 2-8 GB (model dependent)

### Monitoring

```bash
# Watch backend logs
tail -f logs/backend.log

# Monitor system resources
htop

# Check API response times
curl -w "@curl-format.txt" -o /dev/null http://localhost:3000/api/logs

# WebSocket message count
# (check browser DevTools → Network → WS)
```

---

## Future Enhancements

### Planned Features

1. **Authentication System**
   - User login for frontend
   - Role-based access control
   - API key authentication

2. **RAG Integration**
   - ChromaDB for vector storage
   - Semantic search of chat history
   - Long-term memory for entities

3. **Advanced AI Features**
   - Multi-agent coordination
   - Goal-oriented behavior
   - Dynamic personality adjustment

4. **Monitoring Dashboard**
   - Grafana metrics
   - Performance graphs
   - Alert system

5. **Testing Suite**
   - Unit tests
   - Integration tests
   - E2E tests with Playwright

6. **Entity Templates**
   - Pre-configured personalities
   - Import/export entities
   - Marketplace for configs

---

## Contributing

### Development Setup

```bash
# Clone repository
git clone <repo-url>
cd craftbot-mcp

# Install dependencies
npm install

# Copy environment config
cp .env.example .env

# Edit .env with your settings
nano .env

# Start development
npm run dev
```

### Code Structure

```
craftbot-mcp/
├── src/
│   ├── components/      # React components
│   ├── config/          # Configuration schemas
│   ├── pages/           # Page components
│   ├── services/        # API and WebSocket services
│   ├── App.jsx          # Main app component
│   └── main.jsx         # Entry point
├── docs/                # Documentation
├── scripts/             # Utility scripts
├── public/              # Static assets
├── logs/                # Runtime logs
├── .env                 # Environment config (not committed)
├── package.json         # Dependencies
└── vite.config.js       # Build config
```

### Coding Standards

- ESLint for linting
- Prettier for formatting
- Meaningful variable names
- JSDoc comments for functions
- Error handling with try/catch
- Logging for debugging

---

## License

MIT License - See LICENSE file for details.

---

## Support

For issues, questions, or contributions:

- **Documentation:** `/docs` directory
- **Issues:** GitHub Issues
- **Discussions:** GitHub Discussions

---

**Last Updated:** October 1, 2025
**Version:** 1.0.0
