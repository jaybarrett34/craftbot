# MCP Server Architecture

## Overview

The MCP (Minecraft Control Protocol) server bridges Minecraft RCON with an LLM system, enabling AI-controlled entities to interact with players and execute commands in Minecraft.

## Architecture Diagram

```
┌─────────────────┐
│  Minecraft      │
│  Server         │
│  (RCON)         │
└────────┬────────┘
         │
         │ RCON Protocol
         │
┌────────▼────────┐
│  RCON Client    │
│  - Connect      │
│  - Command Queue│
└────────┬────────┘
         │
         │
┌────────▼────────────────────────────────────────┐
│           MCP Server (Express + WebSocket)      │
│                                                  │
│  ┌──────────────┐  ┌──────────────┐            │
│  │ Chat Monitor │  │ State Fetcher│            │
│  │ - Log poll   │  │ - RCON query │            │
│  │ - Parse msgs │  │ - State cache│            │
│  └──────┬───────┘  └──────┬───────┘            │
│         │                  │                     │
│         │                  │                     │
│  ┌──────▼──────────────────▼───────┐            │
│  │   Conversation Queue             │            │
│  │   - Entity queues                │            │
│  │   - History management           │            │
│  └──────┬───────────────────────────┘            │
│         │                                         │
│         │                                         │
│  ┌──────▼───────┐                                │
│  │ Ollama Client│                                │
│  │ - Chat API   │                                │
│  │ - Model mgmt │                                │
│  └──────┬───────┘                                │
│         │                                         │
│         │                                         │
│  ┌──────▼─────────┐   ┌──────────────┐          │
│  │  LLM Parser    │   │   Command    │          │
│  │  - Extract cmd │   │   Validator  │          │
│  │  - Format chat │   │   - CSV rules│          │
│  └────────────────┘   └──────────────┘          │
│                                                   │
└───────────────────────────────────────────────────┘
         │
         │ WebSocket
         │
┌────────▼────────┐
│  Frontend       │
│  (React + Vite) │
└─────────────────┘
```

## Core Components

### 1. RCON Client (`server/rcon-client.js`)

**Purpose:** Manages connection to Minecraft server via RCON protocol.

**Features:**
- Persistent connection with auto-reconnect
- Command queue (processes one at a time with configurable delay)
- Event emitters for connection status
- Error handling and retry logic

**Key Methods:**
- `connect()` - Establish RCON connection
- `sendCommand(command)` - Queue and execute command
- `disconnect()` - Close connection
- `getStatus()` - Get connection status

**Configuration:**
```env
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_password
COMMAND_QUEUE_DELAY=100
```

---

### 2. Chat Monitor (`server/chat-monitor.js`)

**Purpose:** Monitor Minecraft log file for chat messages and player events.

**Features:**
- Poll log file for new lines
- Parse chat messages, joins, leaves
- Filter AI messages (tagged with `[AI]`)
- Proximity detection for NPC interactions
- Chat history storage

**Key Methods:**
- `start()` - Begin monitoring
- `getChatHistory(limit, filter)` - Get recent messages
- `shouldEntityRespond(message, entity)` - Check if entity should respond
- `checkProximity(player, npcPos)` - Check player distance

**Configuration:**
```env
MC_LOG_PATH=/path/to/minecraft/logs/latest.log
CHAT_POLL_INTERVAL=1000
```

**Event Types:**
- `chat` - Player chat message
- `player_join` - Player joined
- `player_leave` - Player left
- `ai_message` - AI-generated message (filtered)

---

### 3. Command Validator (`server/command-validator.js`)

**Purpose:** Validate commands against entity permissions and whitelist.

**Features:**
- Load command rules from CSV
- Permission level checking (readonly, environment, user, mod, admin)
- Entity-specific whitelist/blacklist
- Command parsing and normalization

**Key Methods:**
- `validateCommand(command, entity)` - Validate command
- `getAllowedCommandsForEntity(entity)` - Get entity's allowed commands
- `getCommandInfo(command)` - Get command metadata
- `getStats()` - Get command statistics

**Permission Levels:**
1. **readonly** - Can only observe, no commands
2. **environment** - Non-destructive environment commands (time, weather)
3. **user** - Basic player commands (say, tell)
4. **mod** - Player management (kick, ban, teleport)
5. **admin** - Full access (all commands)

**CSV Format:**
```csv
command,category,permission_level,whitelist,description
say,chat,user,true,Broadcast a message
teleport,movement,mod,true,Teleport entities
```

---

### 4. State Fetcher (`server/state-fetcher.js`)

**Purpose:** Query Minecraft server state (player info, world state) via RCON.

**Features:**
- Cache with TTL (default 5 seconds)
- Entity permission filtering
- Structured data parsing
- Player and world state queries

**Key Methods:**
- `getPlayerState(playerName, fields, entity)` - Get player data
- `getWorldState(fields, entity)` - Get world data
- `getOnlinePlayers()` - Get player list
- `getComprehensiveState(entity, player)` - Get full state

**Available Fields:**

Player State:
- `health` - Player health
- `position` - XYZ coordinates
- `inventory` - Player inventory
- `gamemode` - Game mode
- `effects` - Active effects
- `experience` - XP level

World State:
- `time` - World time
- `weather` - Current weather
- `seed` - World seed
- `difficulty` - Difficulty level

**Configuration:**
```env
STATE_CACHE_TTL=5000
```

---

### 5. Conversation Queue (`server/conversation-queue.js`)

**Purpose:** Manage conversation queues and history for each entity.

**Features:**
- Per-entity message queues
- Conversation history storage
- Context building for LLM
- Processing state management
- History summarization support

**Key Methods:**
- `enqueue(entityId, message)` - Add message to queue
- `processNext(entityId, processorFn)` - Process next message
- `addToHistory(entityId, role, content)` - Add to history
- `buildFullContext(entity, limit)` - Build LLM context
- `summarizeHistory(entityId, keepRecent, summarizerFn)` - Summarize old messages

**Message Flow:**
1. Chat monitor detects player message
2. Message enqueued for relevant entities
3. Entity processes message (if not already processing)
4. Response added to history
5. Commands validated and executed

---

### 6. Ollama Client (`server/ollama-client.js`)

**Purpose:** Interface with Ollama LLM API.

**Features:**
- Chat completion API
- Model management
- Health checking
- Streaming support (optional)

**Key Methods:**
- `chat(messages, options)` - Send chat request
- `generate(prompt, options)` - Generate completion
- `listModels()` - List available models
- `healthCheck()` - Check Ollama availability

**Configuration:**
```env
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2
```

**Example Usage:**
```javascript
const result = await ollamaClient.chat([
  { role: 'system', content: 'You are a helpful NPC' },
  { role: 'user', content: 'Player: Hello!' }
], {
  model: 'llama2',
  temperature: 0.7
});
```

---

### 7. LLM Parser (`server/llm-parser.js`)

**Purpose:** Parse LLM responses to extract commands and chat messages.

**Features:**
- Multiple command pattern detection
- Chat message extraction
- Thought/reasoning extraction
- Minecraft JSON formatting
- Validation

**Supported Patterns:**

Commands:
```
/teleport @p ~ ~10 ~
[COMMAND: /give @p diamond 1]
EXECUTE: /weather clear
```

Chat:
```
[CHAT: Hello, player!]
Regular text (implicit chat)
```

Thoughts:
```
[THINK: I should check the weather first]
```

**Key Methods:**
- `parse(llmResponse, options)` - Parse response
- `formatForMinecraft(parsed, entityName)` - Format for Minecraft
- `validate(parsed)` - Validate parsed response
- `parseAndValidate(llmResponse)` - Parse and validate

---

### 8. MCP Server (`server/mcp-server.js`)

**Purpose:** Main Express server coordinating all components.

**Features:**
- HTTP REST API
- WebSocket real-time updates
- Entity management
- Configuration storage
- Event coordination
- Log aggregation

**HTTP Endpoints:**

**Config:**
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration

**Entities:**
- `GET /api/entities` - List entities
- `POST /api/entities` - Create entity
- `PUT /api/entities/:id` - Update entity
- `DELETE /api/entities/:id` - Delete entity

**RCON:**
- `POST /api/rcon/command` - Send RCON command

**Chat:**
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/search` - Search chat

**State:**
- `GET /api/state/player/:playerName` - Get player state
- `GET /api/state/world` - Get world state

**Ollama:**
- `GET /api/ollama/models` - List models
- `GET /api/ollama/health` - Check Ollama status

**System:**
- `GET /api/health` - Server health check
- `GET /api/server/status` - Full status
- `GET /api/logs` - Server logs
- `POST /api/commands/validate` - Validate command

**WebSocket Events:**

**From Server:**
- `connected` - Initial connection + state
- `chat` - New chat message
- `player_join` - Player joined
- `player_leave` - Player left
- `entity_response` - Entity responded
- `log` - New log entry
- `status` - Status update
- `config` - Config updated
- `entities` - Entities updated

**From Client:**
- `config:update` - Update configuration
- `entity:update` - Update entity

---

## Data Flow

### Player Chat → Entity Response

1. **Chat Detection**
   - Chat monitor polls log file
   - Detects new player message
   - Emits `chat` event

2. **Entity Selection**
   - For each enabled entity:
     - Check if entity should respond (proximity, mention, etc.)
     - Add message to entity's conversation queue

3. **LLM Processing**
   - Dequeue next message for entity
   - Build conversation context (system prompt + history)
   - Fetch game state if entity has permission
   - Send to Ollama API
   - Parse LLM response

4. **Command Validation**
   - Extract commands from response
   - Validate against entity permissions
   - Validate against command whitelist
   - Filter invalid commands

5. **Execution**
   - Execute validated commands via RCON
   - Send chat messages to Minecraft
   - Add to conversation history
   - Broadcast to WebSocket clients

---

## Entity Configuration

```javascript
{
  id: "guard_npc",
  name: "Village Guard",
  type: "npc",
  enabled: true,

  permissions: {
    level: "mod",
    whitelistedCommands: ["*"],
    blacklistedCommands: ["stop", "ban"],
    canExecuteCommands: true
  },

  knowledge: {
    canAccessPlayerState: ["health", "position", "gamemode"],
    canAccessWorldState: ["time", "weather"],
    proximityRequired: true,
    maxProximity: 20
  },

  personality: {
    systemPrompt: "You are a village guard. Be vigilant and helpful.",
    conversationHistoryLimit: 50,
    useSummarization: true
  },

  llm: {
    model: "llama2",
    enabled: true,
    temperature: 0.7
  },

  appearance: {
    position: { x: 100, y: 64, z: 200 },
    chatBubble: true,
    usesServerChat: true
  }
}
```

---

## Installation & Setup

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Minecraft RCON
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_password_here

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2

# Server
SERVER_PORT=3000

# Minecraft Log
MC_LOG_PATH=/path/to/minecraft/logs/latest.log

# Polling & Caching
CHAT_POLL_INTERVAL=1000
COMMAND_QUEUE_DELAY=100
STATE_CACHE_TTL=5000
```

### 3. Enable Minecraft RCON

In your Minecraft `server.properties`:

```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_password_here
```

### 4. Install & Run Ollama

```bash
# Install Ollama (see https://ollama.ai)
# Pull a model
ollama pull llama2
```

### 5. Start Server

```bash
# Backend only
npm run server

# Frontend only
npm run dev

# Both together
npm run dev:full
```

---

## Usage Examples

### Create an NPC Entity

```javascript
// POST /api/entities
{
  "name": "Merchant Bob",
  "type": "npc",
  "enabled": true,
  "permissions": {
    "level": "user",
    "whitelistedCommands": ["say", "tell"],
    "canExecuteCommands": true
  },
  "personality": {
    "systemPrompt": "You are a merchant. Sell items and be friendly."
  },
  "llm": {
    "model": "llama2",
    "enabled": true
  }
}
```

### Send Manual Command

```javascript
// POST /api/rcon/command
{
  "command": "say Hello from the API!"
}
```

### Get Player State

```javascript
// GET /api/state/player/Steve?fields=health,position,inventory
```

### Search Chat History

```javascript
// GET /api/chat/search?query=diamond&limit=10
```

---

## Troubleshooting

### RCON Connection Failed

- Check Minecraft server is running
- Verify RCON is enabled in `server.properties`
- Confirm password matches
- Check firewall allows port 25575

### Ollama Not Responding

- Ensure Ollama is running: `ollama serve`
- Check model is pulled: `ollama list`
- Verify OLLAMA_URL is correct
- Test with: `curl http://localhost:11434/api/tags`

### Chat Monitor Not Detecting Messages

- Verify MC_LOG_PATH points to correct log file
- Check file permissions (server must be able to read)
- Confirm log file is being written to
- Test with: `tail -f /path/to/logs/latest.log`

### Commands Not Executing

- Check entity has `canExecuteCommands: true`
- Verify command is in entity's whitelist
- Check permission level is sufficient
- Look at logs for validation errors

---

## Development

### Adding New Commands

1. Add to `data/minecraft-commands.csv`:
```csv
mycommand,category,permission_level,true,Description
```

2. Command validator automatically reloads

### Adding New State Fields

1. Update `state-fetcher.js`:
```javascript
case 'myfield':
  command = 'data get entity ${playerName} MyField';
  break;
```

2. Add to entity's `canAccessPlayerState` array

### Custom LLM Parsing

Update `llm-parser.js` patterns:
```javascript
this.customPattern = /\[CUSTOM:\s*(.+?)\]/gi;
```

---

## Security Considerations

1. **Command Validation** - All commands validated before execution
2. **Permission Levels** - Entity permissions enforced
3. **Whitelist/Blacklist** - Per-entity command filtering
4. **State Access** - Entity knowledge restrictions
5. **RCON Password** - Store in `.env`, never commit
6. **Input Sanitization** - Escape user input for Minecraft JSON

---

## Performance

### Optimization Tips

1. **State Cache** - Adjust `STATE_CACHE_TTL` based on needs
2. **Command Delay** - Increase `COMMAND_QUEUE_DELAY` if server lags
3. **History Limit** - Use `conversationHistoryLimit` to limit memory
4. **Summarization** - Enable `useSummarization` for long conversations
5. **Proximity** - Use `proximityRequired` to reduce unnecessary processing

### Resource Usage

- **Memory** - ~50-200MB depending on history size
- **CPU** - Minimal (polling, parsing)
- **Network** - Low (RCON commands, Ollama API)
- **Disk** - Minimal (logs, config)

---

## Future Enhancements

- [ ] RAG integration (ChromaDB for chat history search)
- [ ] Multi-server support
- [ ] Plugin system for custom behaviors
- [ ] Voice chat integration
- [ ] Advanced pathfinding for NPCs
- [ ] Custom command macros
- [ ] Scheduled tasks/events
- [ ] Analytics dashboard

---

## License

See LICENSE file.

## Contributing

See CONTRIBUTING.md for guidelines.
