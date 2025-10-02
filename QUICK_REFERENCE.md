# CRAFTBOT MCP - QUICK REFERENCE

This is your one-page reference for all important commands, URLs, and troubleshooting.

---

## ESSENTIAL COMMANDS

### Start Services

```bash
# Start Ollama
ollama serve

# Start Minecraft Server
cd ~/minecraft-server
java -Xmx4G -jar server.jar nogui

# Start MCP Server
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run server

# Start Frontend
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run dev

# Start Everything at Once (if configured)
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
./scripts/start-all.sh
```

---

### Stop Services

```bash
# Stop with Ctrl+C in each terminal, or:

# Emergency stop all
pkill -f "node.*mcp-server"  # Stop MCP
pkill -f "vite"              # Stop frontend
pkill -f "ollama"            # Stop Ollama
pkill -f "minecraft.*server" # Stop Minecraft
```

---

### Check Service Status

```bash
# Check if Ollama is running
curl http://localhost:11434/api/tags

# Check if MCP server is running
curl http://localhost:3000/api/health

# Check if Minecraft server is running
ps aux | grep "minecraft.*server"

# Check port usage
lsof -i :11434  # Ollama
lsof -i :3000   # MCP Server
lsof -i :5173   # Frontend
lsof -i :25575  # Minecraft RCON
```

---

### Ollama Commands

```bash
# Start Ollama
ollama serve

# List available models
ollama list

# Pull a model
ollama pull llama2
ollama pull qwen2.5:14b-instruct
ollama pull mistral
ollama pull phi

# Test Ollama
curl http://localhost:11434/api/tags

# Remove a model
ollama rm llama2
```

---

### NPM Commands

```bash
# Install dependencies
npm install

# Start MCP server only
npm run server

# Start frontend only
npm run dev

# Start both (requires concurrently)
npm run dev:full

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Check for vulnerabilities
npm audit

# Update dependencies
npm update
```

---

### Minecraft Server Commands

```bash
# Start server
cd ~/minecraft-server
java -Xmx4G -jar server.jar nogui

# Start with more RAM
java -Xmx8G -jar server.jar nogui

# Start with Fabric mods
java -Xmx4G -jar fabric-server-launch.jar nogui

# View server log
tail -f ~/minecraft-server/logs/latest.log

# Edit server properties
nano ~/minecraft-server/server.properties
```

---

### Git Commands

```bash
# Check status
git status

# Pull latest changes
git pull

# Commit changes
git add .
git commit -m "Your message"
git push

# Discard local changes
git reset --hard HEAD
```

---

## IMPORTANT URLS

### Local Services

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:5173 | Web interface |
| MCP Server | http://localhost:3000 | Backend API |
| API Docs | http://localhost:3000/api | API endpoint base |
| Ollama | http://localhost:11434 | LLM service |
| Minecraft | localhost:25565 | Game server |
| RCON | localhost:25575 | Remote console |

---

### API Endpoints

```bash
# Health check
GET http://localhost:3000/api/health

# Get all entities
GET http://localhost:3000/api/entities

# Create entity
POST http://localhost:3000/api/entities

# Update entity
PUT http://localhost:3000/api/entities/:id

# Delete entity
DELETE http://localhost:3000/api/entities/:id

# Get logs
GET http://localhost:3000/api/logs

# Validate command
POST http://localhost:3000/api/commands/validate

# Get server status
GET http://localhost:3000/api/server/status

# Ollama health
GET http://localhost:3000/api/ollama/health
```

---

## IMPORTANT FILE LOCATIONS

### Configuration Files

```bash
# Environment configuration
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env

# Environment template
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env.example

# Package configuration
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/package.json

# Minecraft commands list
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/minecraft-commands.csv
```

---

### Server Files

```bash
# MCP server main file
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/server/mcp-server.js

# RCON client
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/server/rcon-client.js

# Chat monitor
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/server/chat-monitor.js

# LLM parser
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/server/llm-parser.js

# Command validator
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/server/command-validator.js

# Ollama client
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/server/ollama-client.js
```

---

### Documentation

```bash
# Quick start guide (START HERE)
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/QUICK_START.md

# This quick reference (YOU ARE HERE)
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/QUICK_REFERENCE.md

# Troubleshooting guide
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/TROUBLESHOOTING.md

# Setup guides
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/SETUP_GUIDE.md
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/OLLAMA_VERIFICATION.md

# Testing guides
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/TESTING_GUIDE.md
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/TESTING.md

# Architecture docs
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/SERVER_ARCHITECTURE.md
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/llm-architecture.md

# Reference docs
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/xml-tag-reference.md
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/quick-start.md

# Verification reports (moved to docs/reports/)
/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/reports/
```

---

### Minecraft Server

```bash
# Server directory (default)
~/minecraft-server/

# Server properties
~/minecraft-server/server.properties

# Server log
~/minecraft-server/logs/latest.log

# Server JAR
~/minecraft-server/server.jar
```

---

### Logs

```bash
# MCP server logs (console output)
# View in terminal where you ran: npm run server

# Frontend logs (console output)
# View in terminal where you ran: npm run dev

# Minecraft server logs
~/minecraft-server/logs/latest.log

# Ollama logs (console output)
# View in terminal where you ran: ollama serve
```

---

## CONSOLE LOG MESSAGES REFERENCE

### Chat Detection

```
[Chat Monitor] Detected message: <Player> hello
```
**Meaning:** Successfully detected player chat message from log file.
**Normal:** Yes
**Action:** None

---

```
[Chat Monitor] Ignored non-chat line: [XX:XX:XX] [Server thread/INFO]: ...
```
**Meaning:** Skipped server log line that isn't a chat message.
**Normal:** Yes
**Action:** None

---

```
[Chat Monitor] Started watching: /path/to/logs/latest.log
```
**Meaning:** Chat monitor initialized and watching log file.
**Normal:** Yes
**Action:** None

---

### LLM Processing

```
[LLM Client] Sending prompt to Ollama (model: llama2)...
```
**Meaning:** Sending request to Ollama for LLM response.
**Normal:** Yes
**Action:** Wait for response (may take 5-30 seconds)

---

```
[LLM Client] Received response from Ollama (took XXXXms)
```
**Meaning:** LLM successfully generated response.
**Normal:** Yes
**Action:** None

---

```
[LLM Parser] Parsing XML response...
```
**Meaning:** Extracting XML tags from LLM output.
**Normal:** Yes
**Action:** None

---

```
[LLM Parser] Found <thinking> tag: "The player is greeting me..."
```
**Meaning:** LLM generated internal reasoning (not visible to players).
**Normal:** Yes
**Action:** None

---

```
[LLM Parser] Found <say> tag: "Hello there!"
```
**Meaning:** LLM generated chat response.
**Normal:** Yes
**Action:** This will be sent to Minecraft chat

---

```
[LLM Parser] Found <function> tag: give Player diamond 1
```
**Meaning:** LLM generated a Minecraft command to execute.
**Normal:** Yes
**Action:** Command will be validated then executed

---

```
[LLM Parser] Found <silence/> tag
```
**Meaning:** LLM chose not to respond (intentional silence).
**Normal:** Yes
**Action:** No response will be sent

---

### Command Validation

```
[Command Validator] Validating command: give Player diamond 1
```
**Meaning:** Checking if entity has permission to execute command.
**Normal:** Yes
**Action:** None

---

```
[Command Validator] Command allowed (entity has admin permission)
```
**Meaning:** Command passed validation and will execute.
**Normal:** Yes
**Action:** None

---

```
[Command Validator] Command REJECTED: insufficient permissions
```
**Meaning:** Entity doesn't have required permission level.
**Normal:** Depends on intent
**Action:** Review entity permissions if unexpected

---

```
[Command Validator] Command REJECTED: not in whitelist
```
**Meaning:** Command not in entity's whitelistedCommands.
**Normal:** Depends on intent
**Action:** Add command to whitelist if you want to allow it

---

```
[Command Validator] Command REJECTED: in blacklist
```
**Meaning:** Command is explicitly forbidden for this entity.
**Normal:** Depends on intent
**Action:** Remove from blacklist if you want to allow it

---

### RCON

```
[RCON] Connected to localhost:25575
```
**Meaning:** Successfully connected to Minecraft server via RCON.
**Normal:** Yes
**Action:** None

---

```
[RCON] Executing: say [AI] <console> Hello!
```
**Meaning:** Sending command to Minecraft server.
**Normal:** Yes
**Action:** None

---

```
[RCON] Response: [Player] was given [Diamond] * 1
```
**Meaning:** Command executed successfully, showing Minecraft's response.
**Normal:** Yes
**Action:** None

---

```
[ERROR] RCON connection failed: ECONNREFUSED
```
**Meaning:** Cannot connect to Minecraft RCON.
**Normal:** No
**Action:** Check Minecraft server running, verify RCON settings

---

```
[ERROR] RCON authentication failed
```
**Meaning:** Wrong RCON password.
**Normal:** No
**Action:** Check RCON_PASSWORD in .env matches server.properties

---

### Conversation Queue

```
[Conversation Queue] Added message to queue for entity: console
```
**Meaning:** Message queued for processing by entity.
**Normal:** Yes
**Action:** None

---

```
[Conversation Queue] Processing entity: console
```
**Meaning:** Starting to process queued messages for entity.
**Normal:** Yes
**Action:** None

---

```
[Conversation Queue] No messages in queue for entity: console
```
**Meaning:** Entity has no pending messages to process.
**Normal:** Yes
**Action:** None

---

### State Fetcher

```
[State Fetcher] Fetching player state for: Player
```
**Meaning:** Retrieving player information (health, position, etc.)
**Normal:** Yes
**Action:** None

---

```
[State Fetcher] Fetching world state
```
**Meaning:** Retrieving world information (time, weather, etc.)
**Normal:** Yes
**Action:** None

---

```
[State Fetcher] Using cached state (age: XXXXms)
```
**Meaning:** Using recently cached data instead of fetching fresh.
**Normal:** Yes
**Action:** None (improves performance)

---

### WebSocket

```
[WebSocket] Client connected
```
**Meaning:** Frontend connected to backend.
**Normal:** Yes
**Action:** None

---

```
[WebSocket] Client disconnected
```
**Meaning:** Frontend disconnected from backend.
**Normal:** Sometimes (page refresh, network issue)
**Action:** Check if intentional or network problem

---

```
[WebSocket] Broadcasting to X clients: entities
```
**Meaning:** Sending updated data to connected frontends.
**Normal:** Yes
**Action:** None

---

### Errors to Watch For

```
[ERROR] Ollama request failed: ECONNREFUSED
```
**Meaning:** Cannot connect to Ollama.
**Normal:** No
**Action:** Start Ollama with `ollama serve`

---

```
[ERROR] Failed to parse LLM response: Unexpected token
```
**Meaning:** LLM returned malformed XML.
**Normal:** Rare, usually temporary
**Action:** Check Ollama logs, may need to retry

---

```
[ERROR] Cannot read log file: ENOENT
```
**Meaning:** Minecraft log file not found.
**Normal:** No
**Action:** Verify MC_LOG_PATH in .env

---

```
[ERROR] Command execution failed: Unknown command
```
**Meaning:** Invalid Minecraft command syntax.
**Normal:** No
**Action:** Check command syntax in minecraft-commands.csv

---

## COMMON ISSUES & QUICK FIXES

### Cannot Connect to RCON

```bash
# Check Minecraft server is running
ps aux | grep minecraft

# Check RCON port
lsof -i :25575

# Verify RCON enabled
grep rcon ~/minecraft-server/server.properties

# Check password matches
cat /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env | grep RCON_PASSWORD
cat ~/minecraft-server/server.properties | grep rcon.password
```

---

### Ollama Not Responding

```bash
# Check if Ollama is running
ps aux | grep ollama

# Start Ollama
ollama serve

# Test connection
curl http://localhost:11434/api/tags

# Check model is available
ollama list
```

---

### Chat Not Detected

```bash
# Check log file exists
ls -la ~/minecraft-server/logs/latest.log

# Check log path in .env
cat /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env | grep MC_LOG_PATH

# Watch log file directly
tail -f ~/minecraft-server/logs/latest.log

# Send test message in Minecraft and verify it appears in log
```

---

### Entity Not Responding

```bash
# Check entity is enabled
curl http://localhost:3000/api/entities | grep -A 5 "console"

# Check LLM is enabled for entity
curl http://localhost:3000/api/entities | grep -A 10 "llm"

# Check MCP server logs for errors
# (view in terminal where you ran: npm run server)

# Check Ollama is responding
curl http://localhost:3000/api/ollama/health
```

---

### Frontend Not Connecting

```bash
# Check MCP server is running
curl http://localhost:3000/api/health

# Check WebSocket connection
# Open browser console (F12) and look for WebSocket errors

# Verify VITE_API_URL
cat /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env | grep VITE_API_URL

# Restart frontend
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run dev
```

---

### Commands Not Executing

```bash
# Check entity permissions
curl http://localhost:3000/api/entities | grep -A 20 "permissions"

# Test command validation
curl -X POST http://localhost:3000/api/commands/validate \
  -H "Content-Type: application/json" \
  -d '{"command": "give Steve diamond 1", "entityId": "console"}'

# Check MCP server logs for validation messages
```

---

## EMERGENCY PROCEDURES

### Complete System Reset

```bash
# 1. Stop everything
pkill -f "node.*mcp-server"
pkill -f "vite"
pkill -f "ollama"
pkill -f "minecraft.*server"

# 2. Wait 5 seconds
sleep 5

# 3. Start Ollama
ollama serve &

# 4. Start Minecraft
cd ~/minecraft-server
java -Xmx4G -jar server.jar nogui &

# 5. Wait for Minecraft to start (30-60 seconds)
sleep 30

# 6. Start MCP Server
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run server &

# 7. Start Frontend
npm run dev
```

---

### Reset Configuration

```bash
# Backup current .env
cp /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env.backup

# Restore from template
cp /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env.example /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env

# Edit with your settings
nano /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env
```

---

### Clear Entity Data

```bash
# Entities are stored in memory only (unless you've added persistence)
# Simply restart MCP server to reset to default entities

# Stop MCP server
pkill -f "node.*mcp-server"

# Start MCP server
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run server
```

---

### Reinstall Dependencies

```bash
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp

# Remove existing
rm -rf node_modules package-lock.json

# Reinstall
npm install
```

---

## TESTING COMMANDS

### Quick System Test

```bash
# 1. Test Ollama
curl http://localhost:11434/api/tags

# 2. Test MCP Server
curl http://localhost:3000/api/health

# 3. Test entity list
curl http://localhost:3000/api/entities

# 4. Test logs
curl http://localhost:3000/api/logs

# 5. Open frontend
open http://localhost:5173
```

---

### Test RCON Manually

```bash
# Install mcrcon (optional)
brew install mcrcon  # macOS
# or download from https://github.com/Tiiffi/mcrcon

# Test connection
mcrcon -H localhost -P 25575 -p your_password "say Hello from RCON"

# You should see "Hello from RCON" in Minecraft chat
```

---

### Test Ollama Manually

```bash
# Simple test
curl http://localhost:11434/api/tags

# Generate test
curl http://localhost:11434/api/generate -d '{
  "model": "llama2",
  "prompt": "Say hello",
  "stream": false
}'
```

---

### Test Entity Response

```bash
# In Minecraft, type:
# "Hello console"

# Watch MCP server terminal for:
# - [Chat Monitor] Detected message
# - [LLM Client] Sending prompt
# - [LLM Parser] Found <say> tag
# - [RCON] Executing

# You should see response in Minecraft chat within 5-30 seconds
```

---

## USEFUL MINECRAFT COMMANDS

### For Testing

```
/say Test message
/give @s diamond 1
/tp @s 100 64 200
/time set day
/weather clear
/gamemode creative
/gamemode survival
```

---

### For Debugging

```
/list
/help
/seed
/difficulty
/gamerule
```

---

## PERFORMANCE TIPS

### Low-End System

In `.env`:
```env
CHAT_POLL_INTERVAL=2000
COMMAND_QUEUE_DELAY=200
STATE_CACHE_TTL=10000
```

Use smaller model:
```bash
ollama pull phi
```

Set in `.env`:
```env
OLLAMA_MODEL=phi
```

---

### High-End System

In `.env`:
```env
CHAT_POLL_INTERVAL=500
COMMAND_QUEUE_DELAY=50
STATE_CACHE_TTL=2000
```

Use better model:
```bash
ollama pull qwen2.5:14b-instruct
```

Set in `.env`:
```env
OLLAMA_MODEL=qwen2.5:14b-instruct
```

---

## KEYBOARD SHORTCUTS

### Frontend (Browser)

- `F12` - Open developer console
- `Cmd/Ctrl + Shift + R` - Hard refresh
- `Cmd/Ctrl + R` - Soft refresh
- `Cmd/Ctrl + +` - Zoom in
- `Cmd/Ctrl + -` - Zoom out

---

### Terminal

- `Ctrl + C` - Stop current process
- `Ctrl + D` - Exit shell
- `Ctrl + L` - Clear screen
- `Ctrl + R` - Search command history
- `↑/↓ arrows` - Navigate command history

---

### Minecraft

- `T` - Open chat
- `/` - Open chat with command prefix
- `Esc` - Close chat/menu
- `E` - Open inventory
- `F3` - Debug screen (shows coordinates)
- `F3 + F4` - Game mode switcher

---

## IMPORTANT NOTES

### Security

- Never commit `.env` file (contains passwords)
- Use strong RCON password (anyone with it has full server access)
- Review entity permissions carefully
- Monitor command execution in logs
- Keep dependencies updated: `npm audit`

---

### Backups

```bash
# Backup .env
cp .env .env.backup

# Backup Minecraft world
cp -r ~/minecraft-server/world ~/minecraft-server/world.backup

# Backup entity configurations (if you add persistence)
# Currently entities reset on server restart
```

---

### Updates

```bash
# Update npm dependencies
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm update

# Update Ollama
# Visit https://ollama.ai for latest version

# Update models
ollama pull llama2
```

---

## WHEN TO WORRY vs NORMAL OPERATION

### NORMAL (Don't Worry)

- `[Chat Monitor] Ignored non-chat line` - Skipping log lines
- `[State Fetcher] Using cached state` - Performance optimization
- `[Conversation Queue] No messages in queue` - No chat activity
- `[LLM Parser] Found <silence/> tag` - Intentional no-response
- `[WARNING] proximity check failed` - Player too far from NPC

---

### INVESTIGATE (Something Might Be Wrong)

- `[ERROR] RCON connection failed` - Check Minecraft server
- `[ERROR] Ollama request failed` - Check Ollama running
- `[ERROR] Cannot read log file` - Check file path
- `[ERROR] Failed to parse LLM response` - Check Ollama logs
- `[WARNING] Command validation failed` - Check permissions

---

### CRITICAL (Fix Immediately)

- `[ERROR] Server crashed` - Server down
- `ECONNREFUSED` (repeated) - Service not running
- `Cannot find module` - Missing dependencies
- `SyntaxError` - Code error
- `Out of memory` - Insufficient RAM

---

## SUPPORT CHECKLIST

Before asking for help, check:

- [ ] All services are running (Ollama, Minecraft, MCP, Frontend)
- [ ] .env is configured correctly
- [ ] Checked logs for error messages
- [ ] Tried restarting services
- [ ] Read START_HERE.md troubleshooting section
- [ ] Verified Ollama model is pulled
- [ ] Tested RCON connection manually
- [ ] Checked file paths are correct

---

## VERSION INFO

```bash
# Check versions
node --version
npm --version
ollama --version
java -version

# Check current directory
pwd

# Check environment variables
cat /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env
```

---

**Last updated:** 2025-10-01
**Quick Reference Version:** 1.0.0

**For detailed step-by-step testing:** See `START_HERE.md`
**For architecture details:** See `SERVER_ARCHITECTURE.md`
