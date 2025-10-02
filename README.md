# Craftbot MCP

AI-powered NPCs for Minecraft using LLM integration via Ollama.

## Overview

Craftbot MCP (Minecraft Control Protocol) enables intelligent, AI-driven NPCs in Minecraft through seamless integration with large language models. NPCs can understand natural language, maintain conversations, execute commands, and interact with players in contextually appropriate ways.

## Features

- **Natural Language Chat** - NPCs understand and respond to player messages using LLM
- **Command Execution** - NPCs can execute Minecraft commands with permission validation
- **XML-Tagged Responses** - Structured output using `<thinking>`, `<say>`, `<function>`, `<silence/>` tags
- **Permission System** - 4-tier access control (readonly → environment → user → mod → admin)
- **Conversation Memory** - Per-NPC conversation history with context awareness
- **Proximity Detection** - NPCs respond based on player distance
- **Real-time WebSocket** - Live frontend updates with no polling
- **State-Aware Context** - Query player/world data for intelligent responses
- **Custom Target Cursor** - Enhanced UI with liquid ether background effects
- **Config Interface** - Web-based entity configuration and monitoring

## Quick Start

### Prerequisites

- **Node.js 18+** - JavaScript runtime
- **Java 17+** - For Minecraft server
- **Ollama** with qwen2.5:14b-instruct model
- **Minecraft Java Edition 1.20.1+**

### Installation (3 Steps)

```bash
# 1. Install dependencies
npm install

# 2. Setup Minecraft server (automated)
./scripts/setup-minecraft-server.sh

# 3. Setup Ollama and pull model
./scripts/setup-ollama.sh
```

### Configuration

```bash
# Copy environment template
cp .env.example .env

# Edit configuration (set RCON password and paths)
nano .env
```

### Start Services

```bash
# Terminal 1: Start Minecraft server
./scripts/start-minecraft.sh

# Terminal 2: Start Ollama
ollama serve

# Terminal 3: Start MCP server and frontend
npm run dev:full
```

### Test the System

```bash
# Run pre-flight checks
npm run preflight

# Run integration tests
npm run test:integration

# Monitor logs in real-time
npm run debug
```

Then connect to Minecraft (`localhost:25565`) and chat with your AI NPCs!

## Documentation

### Getting Started
- **[Quick Start Guide](QUICK_START.md)** - Complete step-by-step setup (30 min to working system)
- **[Quick Reference](QUICK_REFERENCE.md)** - All commands and URLs in one place
- **[Troubleshooting](TROUBLESHOOTING.md)** - Fix common issues fast

### Setup & Configuration
- **[Setup Guide](docs/SETUP_GUIDE.md)** - Detailed installation instructions
- **[Ollama Setup](docs/OLLAMA_VERIFICATION.md)** - LLM configuration and testing
- **[Architecture](docs/SERVER_ARCHITECTURE.md)** - System design and components

### Testing & Verification
- **[Testing Guide](docs/TESTING_GUIDE.md)** - Comprehensive test procedures
- **[Testing Procedures](docs/TESTING.md)** - Additional testing documentation

### API & Development
- **[LLM Architecture](docs/llm-architecture.md)** - AI integration design
- **[XML Tags](docs/xml-tag-reference.md)** - Response format reference
- **[Quick Start](docs/quick-start.md)** - Developer quick start
- **[Implementation Summary](docs/IMPLEMENTATION_SUMMARY.md)** - Technical overview
- **[Fabric NPC](docs/fabric-npc-implementation.md)** - Minecraft integration
- **[Minecraft Research](docs/minecraft-research.md)** - Command documentation

### Reports & Verification
- **[Verification Complete](docs/reports/VERIFICATION_COMPLETE.md)** - Final verification status
- **[Backend Logic Report](docs/reports/BACKEND_LOGIC_REPORT.md)** - Code verification
- **[Mock Audit Report](docs/reports/MOCK_AUDIT_REPORT.md)** - Dependency audit
- **[Ready to Test](docs/reports/READY_TO_TEST.md)** - Testing readiness
- **[Orchestration Summary](docs/reports/ORCHESTRATION_SUMMARY.md)** - Implementation details

### Complete Documentation Index
- **[Documentation README](docs/README.md)** - Complete documentation index

## Project Structure

```
craftbot-mcp/
├── server/                      # Backend MCP server
│   ├── mcp-server.js           # Main Express + WebSocket server
│   ├── rcon-client.js          # Minecraft RCON connection
│   ├── chat-monitor.js         # Log file monitoring
│   ├── command-validator.js    # Permission enforcement
│   ├── state-fetcher.js        # Game state queries
│   ├── conversation-queue.js   # Message queue management
│   ├── ollama-client.js        # LLM API client
│   └── llm-parser.js           # XML response parsing
├── src/                        # Frontend React application
│   ├── components/             # UI components
│   ├── services/               # API and WebSocket services
│   └── config/                 # Default configuration
├── docs/                       # Documentation
│   ├── reports/                # Verification and audit reports
│   ├── *.md                    # Technical documentation
│   └── README.md               # Documentation index
├── scripts/                    # Automation scripts
│   ├── setup-minecraft-server.sh
│   ├── setup-ollama.sh
│   ├── start-minecraft.sh
│   ├── preflight-check.sh
│   └── test-*.sh
├── tests/                      # Test suites
│   └── integration-test.js
├── examples/                   # Code examples
│   └── llm-usage-example.js
├── data/                       # Configuration data
│   └── minecraft-commands.csv
├── QUICK_START.md              # Step-by-step setup guide
├── QUICK_REFERENCE.md          # Command reference
├── TROUBLESHOOTING.md          # Problem resolution
└── README.md                   # This file
```

## Configuration

### Environment Variables (.env)

```bash
# Frontend
VITE_API_URL=http://localhost:3000/api

# Backend Server
SERVER_PORT=3000

# Minecraft RCON
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_secure_password

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b-instruct

# Minecraft Server
MC_LOG_PATH=/path/to/minecraft/logs/latest.log

# Performance Tuning
CHAT_POLL_INTERVAL=1000
COMMAND_QUEUE_DELAY=100
STATE_CACHE_TTL=5000
```

### Entity Configuration Example

```javascript
{
  id: "merchant_bob",
  name: "Bob the Merchant",
  enabled: true,
  permissions: {
    level: "user",
    whitelistedCommands: ["give", "say", "tell"],
    blacklistedCommands: [],
    canExecuteCommands: true
  },
  knowledge: {
    canAccessPlayerState: ["inventory", "position"],
    canAccessWorldState: ["time", "weather"],
    proximityRequired: true,
    maxProximity: 10
  },
  personality: {
    systemPrompt: "You are Bob, a friendly merchant. You trade items for emeralds.",
    conversationHistoryLimit: 50
  },
  llm: {
    model: "qwen2.5:14b-instruct",
    enabled: true,
    temperature: 0.7
  }
}
```

## Scripts

### NPM Scripts

```bash
# Development
npm run dev              # Start frontend dev server (port 5173)
npm run server           # Start backend server (port 3000)
npm run dev:full         # Start both frontend and backend

# Build
npm run build            # Build frontend for production
npm run preview          # Preview production build

# Testing
npm run test             # Run all tests
npm run test:integration # Run integration tests
npm run test:health      # Health check all endpoints
npm run preflight        # Pre-flight system check
npm run debug            # Watch all logs in real-time
```

### Shell Scripts

```bash
# Setup
./scripts/setup-minecraft-server.sh  # Setup Minecraft server (one-time)
./scripts/setup-ollama.sh           # Setup Ollama and pull model (one-time)

# Server Management
./scripts/start-minecraft.sh        # Start Minecraft server
./scripts/stop-minecraft.sh         # Stop Minecraft server

# Testing & Monitoring
./scripts/preflight-check.sh        # Check system requirements
./scripts/test-health.sh            # Health check endpoints
./scripts/debug-logs.sh             # Multi-source log viewer
./scripts/test-ollama.js            # Test Ollama integration
```

## API Endpoints

### Health & Status
- `GET /api/health` - Server health check
- `GET /api/server/status` - Detailed server status

### Configuration
- `GET /api/config` - Get configuration
- `PUT /api/config` - Update configuration

### Entities
- `GET /api/entities` - List all entities
- `POST /api/entities` - Create entity
- `GET /api/entities/:id` - Get entity
- `PUT /api/entities/:id` - Update entity
- `DELETE /api/entities/:id` - Delete entity

### Minecraft Integration
- `POST /api/rcon/command` - Execute RCON command
- `GET /api/chat/history` - Get chat history
- `GET /api/chat/search` - Search chat history
- `GET /api/state/player/:name` - Get player state
- `GET /api/state/world` - Get world state

### LLM Integration
- `POST /api/commands/validate` - Validate command permissions
- `GET /api/ollama/models` - List Ollama models
- `GET /api/ollama/health` - Check Ollama status

### Logs
- `GET /api/logs` - Get server logs

See [Architecture Documentation](docs/SERVER_ARCHITECTURE.md) for complete API reference.

## WebSocket Events

### Client → Server
- `config:update` - Update configuration
- `entity:update` - Update entity

### Server → Client
- `connected` - Connection established with initial state
- `log` - New log entry
- `chat` - Chat message detected
- `player_join` - Player joined server
- `player_leave` - Player left server
- `entity_response` - Entity generated response
- `status` - Status update
- `config` - Configuration changed
- `entities` - Entities updated

## Testing

### Pre-Flight Check

```bash
npm run preflight
```

Verifies:
- Node.js version
- Dependencies installed
- Ollama running
- Ports available
- Configuration files
- File structure

### Integration Tests

```bash
npm run test:integration
```

Tests:
1. RCON Connection
2. Ollama Connection
3. Chat Monitor
4. Command Validator
5. State Fetcher
6. LLM Parser
7. WebSocket Communication
8. Full End-to-End Flow

### Health Check

```bash
npm run test:health
```

Tests all API endpoints for availability and performance.

## Troubleshooting

### RCON Connection Failed
- Verify Minecraft server is running
- Check RCON is enabled in `server.properties`
- Confirm password matches in `.env` and `server.properties`
- Check firewall allows port 25575

### Ollama Not Responding
- Ensure Ollama is running: `ollama serve`
- Verify model is pulled: `ollama list`
- Test connection: `curl http://localhost:11434/api/tags`

### Chat Messages Not Detected
- Verify `MC_LOG_PATH` in `.env` is correct
- Check log file exists and is readable
- Monitor log file: `tail -f /path/to/logs/latest.log`
- Restart MCP server

### NPCs Not Responding
- Check entity is enabled in configuration
- Verify LLM is enabled for entity
- Check Ollama is running and model is loaded
- Review server logs for errors
- Check proximity settings if using proximity-based NPCs

See [Troubleshooting Guide](TROUBLESHOOTING.md) for complete problem resolution.

## Performance Tips

### Low-End Systems
```bash
# In .env
CHAT_POLL_INTERVAL=2000
COMMAND_QUEUE_DELAY=200
STATE_CACHE_TTL=10000

# Use smaller Ollama model
OLLAMA_MODEL=llama2:7b
```

### High-End Systems
```bash
# In .env
CHAT_POLL_INTERVAL=500
COMMAND_QUEUE_DELAY=50
STATE_CACHE_TTL=2000

# Use larger Ollama model
OLLAMA_MODEL=qwen2.5:14b-instruct
```

### Entity Configuration
- Set `conversationHistoryLimit` based on available RAM
- Enable `useSummarization` for long conversations
- Use `proximityRequired` to reduce processing
- Lower `temperature` for more consistent, faster responses

## Security

### Command Validation
- All commands validated before execution
- 4-tier permission system enforced
- Entity-specific whitelist/blacklist
- Command syntax validation

### RCON Security
- Password protection required
- Connection timeout limits
- Auto-reconnect with max attempts
- Rate limiting on command execution

### Best Practices
- Never commit `.env` file (contains passwords)
- Use strong RCON password
- Review entity permissions carefully
- Monitor command execution logs
- Keep dependencies updated: `npm audit`

## Development

### Adding New Commands

Edit `data/minecraft-commands.csv`:
```csv
command,category,permission_level,whitelist,description
mycommand,custom,user,true,My custom command
```

Command validator automatically reloads.

### Custom LLM Parsing

Update regex patterns in `server/llm-parser.js`:
```javascript
this.customPattern = /\[CUSTOM:\s*(.+?)\]/gi;
```

### Adding State Fields

Update `server/state-fetcher.js`:
```javascript
case 'myfield':
  command = `data get entity ${playerName} MyField`;
  break;
```

Add to entity's `canAccessPlayerState` array.

## Contributing

### Code Style
- ESLint-friendly formatting
- Inline comments for complex logic
- Modular architecture
- Comprehensive error handling

### Testing
- Add tests for new features
- Ensure all integration tests pass
- Update documentation
- Test in isolated environment first

### Documentation
- Update relevant .md files
- Add examples for new features
- Include troubleshooting tips
- Update QUICK_REFERENCE.md

## Support

### Documentation
- **Quick Start**: [QUICK_START.md](QUICK_START.md)
- **Troubleshooting**: [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
- **Architecture**: [docs/SERVER_ARCHITECTURE.md](docs/SERVER_ARCHITECTURE.md)
- **All Docs**: [docs/README.md](docs/README.md)

### Resources
- **Ollama**: https://ollama.ai
- **Minecraft Server**: https://minecraft.net
- **Fabric Mod Loader**: https://fabricmc.net

### Getting Help
1. Check [TROUBLESHOOTING.md](TROUBLESHOOTING.md)
2. Run `npm run preflight` for diagnostics
3. Review server logs with `npm run debug`
4. Check [docs/README.md](docs/README.md) for detailed guides

## License

MIT License - See LICENSE file for details

## Acknowledgments

- **Ollama** - Local LLM inference
- **Qwen2.5** - Instruction-following language model
- **Fabric** - Minecraft mod loader
- **Express** - Web framework
- **React + Vite** - Frontend framework

---

**Ready to build AI-powered Minecraft NPCs?** Start with [QUICK_START.md](QUICK_START.md)

**Version**: 1.0.0
**Status**: Production Ready
**Last Updated**: 2025-10-01
