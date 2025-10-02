# MCP Server Setup Guide

## Quick Start

This guide will help you set up and run the MCP server to connect Minecraft with AI entities.

## Prerequisites

1. **Node.js** (v18 or higher)
2. **Minecraft Java Edition Server** with RCON enabled
3. **Ollama** for LLM inference
4. Access to Minecraft server log files

---

## Step 1: Install Dependencies

```bash
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm install
```

This will install:
- `express` - HTTP server
- `ws` - WebSocket server
- `rcon-client` - Minecraft RCON client
- `dotenv` - Environment configuration
- `cors` - Cross-origin support
- And other dependencies...

---

## Step 2: Configure Minecraft Server

### Enable RCON

Edit your Minecraft server's `server.properties`:

```properties
# Enable RCON
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password_here

# Optional: Enable command blocks for advanced features
enable-command-block=true
```

**Restart your Minecraft server** after making these changes.

### Test RCON Connection

You can test RCON using the `mcrcon` tool or wait until the MCP server starts.

---

## Step 3: Install and Configure Ollama

### Install Ollama

Visit [https://ollama.ai](https://ollama.ai) and follow installation instructions for your OS.

**macOS/Linux:**
```bash
curl -fsSL https://ollama.ai/install.sh | sh
```

### Pull a Model

```bash
# Start Ollama (if not already running)
ollama serve

# In another terminal, pull a model
ollama pull llama2

# Or use other models:
# ollama pull mistral
# ollama pull codellama
# ollama pull phi
```

### Verify Ollama is Running

```bash
curl http://localhost:11434/api/tags
```

You should see a JSON response with available models.

---

## Step 4: Configure Environment Variables

### Copy Example Environment File

```bash
cp .env.example .env
```

### Edit `.env` File

Open `.env` and configure:

```env
# Frontend Configuration (for Vite)
VITE_API_URL=http://localhost:3000/api

# Backend Server Configuration
SERVER_PORT=3000

# Minecraft RCON Configuration
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_secure_password_here  # Match server.properties

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2  # Or your preferred model

# Minecraft Server Configuration
MC_LOG_PATH=/path/to/minecraft/server/logs/latest.log

# Chat Monitor Configuration (milliseconds)
CHAT_POLL_INTERVAL=1000  # Check logs every 1 second
COMMAND_QUEUE_DELAY=100  # Wait 100ms between commands

# State Cache Configuration (milliseconds)
STATE_CACHE_TTL=5000  # Cache state for 5 seconds
```

**Important:** Update these values:
- `RCON_PASSWORD` - Must match your Minecraft server
- `MC_LOG_PATH` - Full path to your Minecraft server's latest.log file
- `OLLAMA_MODEL` - Model you pulled with Ollama

### Finding Your Minecraft Log Path

**Common locations:**

macOS:
```
~/minecraft_server/logs/latest.log
```

Linux:
```
/opt/minecraft/logs/latest.log
~/minecraft/logs/latest.log
```

Windows:
```
C:\minecraft_server\logs\latest.log
```

---

## Step 5: Start the Server

### Option 1: Backend Only

```bash
npm run server
```

This starts the MCP server on port 3000 (or your configured port).

### Option 2: Full Stack (Backend + Frontend)

```bash
npm run dev:full
```

This starts:
- MCP Server on port 3000
- Vite dev server on port 5173 (default)

### Option 3: Separate Terminals

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run dev
```

---

## Step 6: Verify Everything Works

### Check Server Status

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "rcon": true,
  "ollama": "unknown",
  "timestamp": "2025-10-01T..."
}
```

### Check Ollama Connection

```bash
curl http://localhost:3000/api/ollama/health
```

Expected response:
```json
{
  "success": true,
  "status": 200,
  "available": true
}
```

### View Logs

```bash
curl http://localhost:3000/api/logs
```

### Access Frontend

Open browser to: `http://localhost:5173`

---

## Step 7: Create Your First AI Entity

### Via Frontend

1. Open `http://localhost:5173` in browser
2. Navigate to "Entities" page
3. Click "Add Entity"
4. Configure entity settings
5. Enable the entity
6. Save

### Via API

```bash
curl -X POST http://localhost:3000/api/entities \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Guard Bot",
    "type": "npc",
    "enabled": true,
    "permissions": {
      "level": "user",
      "whitelistedCommands": ["say", "tell"],
      "blacklistedCommands": [],
      "canExecuteCommands": true
    },
    "knowledge": {
      "canAccessPlayerState": ["health", "position"],
      "canAccessWorldState": ["time", "weather"],
      "proximityRequired": false,
      "maxProximity": null
    },
    "personality": {
      "systemPrompt": "You are a friendly guard bot. Help players and answer questions about the server.",
      "conversationHistoryLimit": 50,
      "useSummarization": false
    },
    "llm": {
      "model": "llama2",
      "enabled": true,
      "temperature": 0.7
    },
    "appearance": {
      "chatBubble": false,
      "usesServerChat": true
    }
  }'
```

---

## Step 8: Test in Minecraft

### Join Your Minecraft Server

Connect to your Minecraft server as usual.

### Send a Chat Message

In Minecraft chat, type:
```
Hello, is anyone there?
```

### Expected Behavior

If everything is configured correctly:
1. MCP server detects your chat message in the log
2. Message is added to the entity's conversation queue
3. Entity's context is built (system prompt + history + game state)
4. Request sent to Ollama
5. LLM response is parsed
6. Commands are validated
7. Response sent back to Minecraft chat
8. You see: `[AI] <Guard Bot> Hello! I'm here to help!`

---

## Troubleshooting

### RCON Connection Issues

**Symptom:** Logs show "RCON connection failed"

**Solutions:**
1. Verify Minecraft server is running
2. Check RCON is enabled in `server.properties`
3. Confirm password matches exactly
4. Test RCON port is accessible:
   ```bash
   telnet localhost 25575
   ```
5. Check firewall isn't blocking port 25575

### Ollama Not Responding

**Symptom:** Entity doesn't respond, logs show Ollama errors

**Solutions:**
1. Ensure Ollama is running:
   ```bash
   ps aux | grep ollama
   # If not running:
   ollama serve
   ```
2. Verify model is pulled:
   ```bash
   ollama list
   ```
3. Test Ollama directly:
   ```bash
   curl http://localhost:11434/api/tags
   ```
4. Check OLLAMA_URL in `.env` is correct

### Chat Monitor Not Detecting Messages

**Symptom:** No response to chat messages

**Solutions:**
1. Verify MC_LOG_PATH is correct
2. Check file permissions (MCP server must read log):
   ```bash
   ls -la /path/to/logs/latest.log
   ```
3. Test log file is being written:
   ```bash
   tail -f /path/to/logs/latest.log
   ```
4. Send a test message in Minecraft and watch the log
5. Check chat monitor logs in MCP server output

### Entity Not Responding

**Symptom:** Entity exists but doesn't respond

**Check:**
1. Entity is enabled: `entity.enabled === true`
2. LLM is enabled: `entity.llm.enabled === true`
3. Entity has permissions: `entity.permissions.canExecuteCommands === true`
4. If proximity required, player is close enough
5. Check server logs for errors:
   ```bash
   curl http://localhost:3000/api/logs | grep -i error
   ```

### Commands Not Executing

**Symptom:** Entity responds but commands don't work

**Check:**
1. Entity has command permission
2. Command is in whitelist (or using `["*"]`)
3. Command not in blacklist
4. Permission level is sufficient
5. Check validation endpoint:
   ```bash
   curl -X POST http://localhost:3000/api/commands/validate \
     -H "Content-Type: application/json" \
     -d '{"command": "/say hello", "entityId": "your-entity-id"}'
   ```

---

## Configuration Examples

### Moderator Bot

```javascript
{
  "name": "ModBot",
  "type": "npc",
  "enabled": true,
  "permissions": {
    "level": "mod",
    "whitelistedCommands": ["*"],
    "blacklistedCommands": ["stop", "op", "deop"],
    "canExecuteCommands": true
  },
  "knowledge": {
    "canAccessPlayerState": ["health", "position", "gamemode"],
    "canAccessWorldState": ["time", "weather", "difficulty"],
    "proximityRequired": false
  },
  "personality": {
    "systemPrompt": "You are a moderator bot. Help manage the server, answer questions, and keep things running smoothly. Be professional but friendly.",
    "conversationHistoryLimit": 100
  },
  "llm": {
    "model": "llama2",
    "enabled": true,
    "temperature": 0.5
  }
}
```

### Quest NPC (Proximity-Based)

```javascript
{
  "name": "Quest Giver",
  "type": "npc",
  "enabled": true,
  "permissions": {
    "level": "user",
    "whitelistedCommands": ["say", "tell", "give"],
    "canExecuteCommands": true
  },
  "knowledge": {
    "canAccessPlayerState": ["position", "inventory"],
    "canAccessWorldState": ["time"],
    "proximityRequired": true,
    "maxProximity": 10
  },
  "personality": {
    "systemPrompt": "You are a quest giver in a medieval village. Offer quests to nearby players. Be mysterious and engaging.",
    "conversationHistoryLimit": 30
  },
  "llm": {
    "model": "llama2",
    "enabled": true,
    "temperature": 0.8
  },
  "appearance": {
    "position": { "x": 100, "y": 64, "z": 200 }
  }
}
```

### Read-Only Observer

```javascript
{
  "name": "Server Stats",
  "type": "console",
  "enabled": true,
  "permissions": {
    "level": "readonly",
    "whitelistedCommands": ["say"],
    "canExecuteCommands": true
  },
  "knowledge": {
    "canAccessPlayerState": ["*"],
    "canAccessWorldState": ["*"],
    "proximityRequired": false
  },
  "personality": {
    "systemPrompt": "You provide server statistics and information. You can see everything but cannot execute admin commands.",
    "conversationHistoryLimit": 20
  },
  "llm": {
    "model": "llama2",
    "enabled": true,
    "temperature": 0.3
  }
}
```

---

## Performance Tuning

### For Low-End Servers

```env
# Reduce polling frequency
CHAT_POLL_INTERVAL=2000

# Increase command delay
COMMAND_QUEUE_DELAY=200

# Longer cache
STATE_CACHE_TTL=10000
```

In entity config:
```javascript
{
  "personality": {
    "conversationHistoryLimit": 20,  // Lower limit
    "useSummarization": true  // Enable summarization
  },
  "llm": {
    "temperature": 0.5  // More deterministic (faster)
  }
}
```

### For High-End Servers

```env
# Faster polling
CHAT_POLL_INTERVAL=500

# Minimal delay
COMMAND_QUEUE_DELAY=50

# Shorter cache for real-time data
STATE_CACHE_TTL=2000
```

---

## Next Steps

1. **Read** `SERVER_ARCHITECTURE.md` for detailed technical documentation
2. **Experiment** with different entity configurations
3. **Monitor** logs to understand behavior
4. **Customize** command permissions in `data/minecraft-commands.csv`
5. **Extend** with custom features as needed

---

## Support

- Check logs: `curl http://localhost:3000/api/logs`
- Test endpoints: See `SERVER_ARCHITECTURE.md` for full API documentation
- Minecraft logs: `tail -f /path/to/minecraft/logs/latest.log`
- Ollama logs: Check Ollama console output

---

## Security Notes

1. **Never commit `.env`** - Contains sensitive passwords
2. **Use strong RCON password** - Anyone with it has full server access
3. **Review entity permissions** - Don't give unnecessary access
4. **Monitor command execution** - Check logs regularly
5. **Firewall RCON port** - Only allow from trusted IPs
6. **Keep dependencies updated** - Run `npm audit` periodically

---

## Common Commands

```bash
# Install dependencies
npm install

# Start backend server
npm run server

# Start frontend dev server
npm run dev

# Start both (requires concurrently)
npm run dev:full

# Build frontend for production
npm run build

# Preview production build
npm run preview

# Check for security issues
npm audit

# Update dependencies
npm update
```

---

Happy crafting with AI!
