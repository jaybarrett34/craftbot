# Craftbot MCP - Testing Guide

This guide provides comprehensive instructions for setting up and testing the Craftbot MCP system with a local Minecraft server.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Quick Start](#quick-start)
3. [Detailed Setup](#detailed-setup)
4. [Testing the System](#testing-the-system)
5. [Troubleshooting](#troubleshooting)
6. [Advanced Testing](#advanced-testing)

---

## Prerequisites

Before you begin, ensure you have the following installed:

### Required Software

1. **Java 17 or higher**
   ```bash
   # macOS
   brew install openjdk@17

   # Linux (Ubuntu/Debian)
   sudo apt install openjdk-17-jdk

   # Verify installation
   java -version
   ```

2. **Node.js 18 or higher**
   ```bash
   # Verify installation
   node --version
   npm --version
   ```

3. **Ollama** (for AI functionality)
   ```bash
   # Visit https://ollama.ai to download
   # Or on macOS:
   brew install ollama

   # Pull a model
   ollama pull qwen2.5:14b-instruct
   # or
   ollama pull llama2

   # Start Ollama server
   ollama serve
   ```

4. **Minecraft Java Edition 1.20.1**
   - Purchase and install from minecraft.net
   - Make sure you can launch version 1.20.1

---

## Quick Start

If you just want to get up and running quickly:

```bash
# 1. Install dependencies
npm install

# 2. Set up Minecraft server (automated)
./scripts/setup-minecraft-server.sh

# 3. Start Minecraft server
./scripts/start-minecraft.sh

# 4. In a new terminal, start Craftbot MCP server
npm run dev

# 5. Connect to Minecraft (localhost:25565)
# 6. Spawn test NPCs (see minecraft-server/test-npcs.txt)
# 7. Type in chat to interact with NPCs
```

---

## Detailed Setup

### Step 1: Clone and Install Dependencies

```bash
cd /path/to/craftbot-mcp
npm install
```

### Step 2: Configure Environment

1. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` and configure settings:
   ```bash
   # Frontend Configuration
   VITE_API_URL=http://localhost:3000/api

   # Backend Server Configuration
   SERVER_PORT=3000

   # Minecraft RCON Configuration
   RCON_HOST=localhost
   RCON_PORT=25575
   RCON_PASSWORD=craftbot_rcon_pass

   # Ollama Configuration
   OLLAMA_URL=http://localhost:11434
   OLLAMA_MODEL=qwen2.5:14b-instruct

   # Minecraft Server Configuration
   MINECRAFT_SERVER_PATH=./minecraft-server
   MC_LOG_PATH=./minecraft-server/logs/latest.log

   # Chat Monitor Configuration
   CHAT_POLL_INTERVAL=1000
   COMMAND_QUEUE_DELAY=100

   # State Cache Configuration
   STATE_CACHE_TTL=5000
   ```

### Step 3: Set Up Minecraft Server

Run the automated setup script:

```bash
./scripts/setup-minecraft-server.sh
```

This script will:
- Download and install Fabric server (1.20.1)
- Accept the EULA automatically
- Configure RCON settings
- Download Fabric API mod
- Create start/stop scripts
- Set proper permissions

**What to expect:**
- The script will prompt for RCON password (or use default: `craftbot_rcon_pass`)
- Installation takes 2-5 minutes depending on internet speed
- Server files will be in `./minecraft-server/`

### Step 4: Start Ollama

Make sure Ollama is running:

```bash
# In a separate terminal
ollama serve

# Verify it's working
curl http://localhost:11434/api/tags
```

### Step 5: Start Minecraft Server

```bash
./scripts/start-minecraft.sh
```

**What to expect:**
- Server starts in background
- Logs are displayed in terminal
- Press Ctrl+C to stop watching logs (server continues running)
- First startup may take 1-2 minutes to generate world

**Verify server is running:**
```bash
# Check if server process is running
pgrep -f fabric-server-launch

# Check server logs
tail -f minecraft-server/logs/latest.log
```

### Step 6: Start Craftbot MCP Server

In a new terminal:

```bash
npm run dev
```

**What to expect:**
- Frontend available at http://localhost:5173
- Backend API at http://localhost:3000
- WebSocket connection to Minecraft logs
- RCON connection to Minecraft server

**Verify services:**
- Check frontend: Open http://localhost:5173 in browser
- Check API: `curl http://localhost:3000/api/health`
- Check logs for "RCON connected" message

---

## Testing the System

### Step 1: Connect to Minecraft Server

1. Launch Minecraft Java Edition 1.20.1
2. Click "Multiplayer"
3. Click "Add Server"
4. Configure:
   - Server Name: `Craftbot MCP Test`
   - Server Address: `localhost`
5. Click "Done" and then "Join Server"

### Step 2: Give Yourself OP Permissions

In the Minecraft server console (or via RCON):

```
/op YourMinecraftUsername
```

Or if you're watching the terminal where Minecraft is running, you can also use the stop-watching shortcut (Ctrl+C) and use RCON:

```bash
# Using mcrcon (if installed)
mcrcon -H localhost -P 25575 -p craftbot_rcon_pass "op YourUsername"
```

### Step 3: Prepare Testing Environment

In Minecraft chat or console, run these commands:

```minecraft
# Teleport to a clear area
/tp @p 0 64 0

# Create a flat platform
/fill ~-10 ~-1 ~-10 ~10 ~-1 ~10 stone

# Clear area above
/fill ~-10 ~ ~-10 ~10 ~10 ~10 air

# Set time to day
/time set day

# Clear weather
/weather clear

# Useful gamerules
/gamerule keepInventory true
/gamerule doDaylightCycle false
```

### Step 4: Spawn Test NPCs

Copy commands from `minecraft-server/test-npcs.txt`. Here are the essential ones:

```minecraft
# Spawn a merchant NPC
/summon armor_stand ~ ~ ~ {CustomName:'{"text":"[AI] Bob the Merchant"}',CustomNameVisible:1b,NoGravity:1b,Marker:0b,Invulnerable:1b,ShowArms:1b}

# Spawn a guard NPC
/summon armor_stand ~3 ~ ~ {CustomName:'{"text":"[AI] Guard Captain"}',CustomNameVisible:1b,NoGravity:1b,Marker:0b,Invulnerable:1b,ShowArms:1b}

# Spawn a wizard NPC
/summon armor_stand ~-3 ~ ~ {CustomName:'{"text":"[AI] Wizard Merlin"}',CustomNameVisible:1b,NoGravity:1b,Marker:0b,Invulnerable:1b,ShowArms:1b}
```

**Important:** The `[AI]` tag in the NPC name tells Craftbot MCP that this entity should use AI responses.

### Step 5: Test AI Interactions

Type these messages in Minecraft chat:

```
Hello Bob, what do you sell?
```

```
Guard Captain, is everything safe?
```

```
Wizard Merlin, can you teach me magic?
```

```
I need help with something
```

### Step 6: Verify System Behavior

**Expected Behavior:**

1. **Minecraft Server Logs** (`minecraft-server/logs/latest.log`):
   - You should see your chat messages appear in the log
   - Example: `[Server thread/INFO]: <YourUsername> Hello Bob, what do you sell?`

2. **Craftbot MCP Console**:
   - Chat messages are detected
   - Messages sent to AI for processing
   - AI responses generated
   - Commands sent back to Minecraft via RCON

3. **Minecraft Game**:
   - NPC responds in chat
   - Example: `[AI] Bob the Merchant: Hello there! I have many fine wares...`

4. **Web Interface** (http://localhost:5173):
   - View live chat messages
   - Monitor NPC conversations
   - See AI processing status

### Step 7: Test Command Execution

Some NPCs can execute commands. Test with:

```
Bob, can you give me a diamond?
```

**Expected:** If Bob has permissions, he might execute `/give YourUsername diamond 1`

---

## Verification Checklist

Use this checklist to ensure everything is working:

- [ ] Minecraft server is running (check with `pgrep -f fabric-server-launch`)
- [ ] Can connect to Minecraft server from game client
- [ ] Ollama is running and accessible (`curl http://localhost:11434/api/tags`)
- [ ] Craftbot MCP server is running (`curl http://localhost:3000/api/health`)
- [ ] RCON connection established (check logs for "RCON connected")
- [ ] WebSocket monitoring logs (check logs for "Watching log file")
- [ ] NPCs spawned with `[AI]` tag in names
- [ ] Chat messages appear in Minecraft logs
- [ ] Chat messages detected by Craftbot MCP
- [ ] AI generates responses (check Craftbot console)
- [ ] NPC responses appear in Minecraft chat
- [ ] Web interface shows live updates

---

## Troubleshooting

### Minecraft Server Won't Start

**Problem:** Server fails to start or crashes immediately

**Solutions:**
1. Check Java version: `java -version` (needs 17+)
2. Check logs: `cat minecraft-server/logs/latest.log`
3. Verify EULA accepted: `cat minecraft-server/eula.txt` (should have `eula=true`)
4. Check port availability: `lsof -i :25565` (should be free)
5. Delete and reinstall: `rm -rf minecraft-server && ./scripts/setup-minecraft-server.sh`

### Can't Connect to Minecraft Server

**Problem:** "Connection refused" or "Connection timed out"

**Solutions:**
1. Verify server is running: `pgrep -f fabric-server-launch`
2. Check server startup: `tail -f minecraft-server/logs/latest.log`
3. Wait for "Done" message in logs (server takes 1-2 minutes to start)
4. Check firewall settings
5. Try `127.0.0.1` instead of `localhost`

### RCON Connection Failed

**Problem:** Craftbot can't connect to RCON

**Solutions:**
1. Check RCON enabled in `minecraft-server/server.properties`:
   ```
   enable-rcon=true
   rcon.port=25575
   rcon.password=craftbot_rcon_pass
   ```
2. Verify password matches in `.env` file
3. Check port availability: `lsof -i :25575`
4. Restart Minecraft server
5. Check Craftbot logs for detailed error messages

### Chat Messages Not Detected

**Problem:** Chat messages don't trigger AI responses

**Solutions:**
1. Verify log file path in `.env`: `MC_LOG_PATH=./minecraft-server/logs/latest.log`
2. Check file exists: `ls -la minecraft-server/logs/latest.log`
3. Check file permissions: Should be readable
4. Restart Craftbot MCP server
5. Check Craftbot console for "Watching log file" message
6. Type a message in Minecraft chat and check if it appears in logs

### AI Not Responding

**Problem:** Messages detected but no AI responses

**Solutions:**
1. Check Ollama is running: `curl http://localhost:11434/api/tags`
2. Verify model is pulled: `ollama list`
3. Check model name in `.env` matches pulled model
4. Check Craftbot console for AI processing errors
5. Try a simpler model: `ollama pull llama2`
6. Check Ollama logs: `tail -f ~/.ollama/logs/server.log`

### NPCs Not Spawning

**Problem:** Spawn commands don't work

**Solutions:**
1. Make sure you have OP permissions: `/op YourUsername`
2. Check command syntax (copy from `test-npcs.txt`)
3. Try spawning regular entities first: `/summon pig`
4. Check server logs for error messages
5. Verify you're in Creative or have permissions

### NPC Name Tags Not Visible

**Problem:** Can't see `[AI]` tags above NPCs

**Solutions:**
1. Check `CustomNameVisible:1b` in spawn command
2. Move closer to NPC (names appear within certain distance)
3. Check F3+B debug screen to see entity hitboxes
4. Try re-summoning with correct command

### Permission Errors

**Problem:** NPCs can't execute commands

**Solutions:**
1. Check NPC permissions in entity configuration
2. Verify `canExecuteCommands: true` in NPC settings
3. Check `allowedCommands` list includes desired command
4. Check Minecraft server logs for permission errors
5. Some commands may be restricted by server configuration

---

## Advanced Testing

### Testing Conversation History

1. Have a multi-turn conversation:
   ```
   Hello Bob
   [wait for response]
   What did I just say?
   [Bob should remember previous context]
   ```

2. Check conversation queue:
   - Web interface should show conversation history
   - Each NPC maintains separate conversation history

### Testing Priority System

1. Send messages to multiple NPCs quickly:
   ```
   Bob, hello!
   Guard, hello!
   Wizard, hello!
   ```

2. Observe processing order (should be priority-based)

### Testing Command Permissions

1. Configure NPC with specific permissions (in code):
   ```javascript
   permissions: {
     canExecuteCommands: true,
     allowedCommands: ['give', 'tell']
   }
   ```

2. Ask NPC to execute allowed command:
   ```
   Bob, give me a diamond
   ```

3. Ask NPC to execute forbidden command:
   ```
   Bob, set the time to night
   ```

4. Verify only allowed commands are executed

### Testing XML Response Tags

NPCs can use XML tags in responses. Check Craftbot console for:

- `<thinking>` - Internal reasoning (not shown to player)
- `<say>` - Text to say in chat
- `<function>` - Commands to execute
- `<silence/>` - Choose not to respond

### Testing Auto-Processing Mode

1. Enable auto-processing in web interface
2. Messages should be processed automatically
3. Disable and test manual processing mode

### Stress Testing

1. Spawn many NPCs (10+)
2. Send rapid chat messages
3. Monitor system performance
4. Check for memory leaks or slowdowns

### Testing Proximity

1. Configure proximity-based responses
2. Test NPC responses at different distances
3. Verify closer NPCs respond first

---

## Monitoring and Logs

### Key Log Files

1. **Minecraft Server Logs**:
   ```bash
   tail -f minecraft-server/logs/latest.log
   ```

2. **Craftbot MCP Logs**:
   - Console output from `npm run dev`
   - Check for errors, warnings, AI processing

3. **Ollama Logs**:
   ```bash
   tail -f ~/.ollama/logs/server.log
   ```

### What to Look For

**Good Signs:**
- "RCON connected"
- "Watching log file"
- "Chat message detected"
- "Processing message for entity"
- "AI response generated"
- "Command sent via RCON"

**Warning Signs:**
- "RCON connection failed"
- "Could not read log file"
- "Ollama request failed"
- "No entities registered"
- "Command execution failed"

---

## Performance Tips

1. **Use Flat World**: Reduces server load
   ```minecraft
   level-type=minecraft:flat
   ```

2. **Disable Unnecessary Features**:
   ```minecraft
   spawn-monsters=false
   generate-structures=false
   ```

3. **Adjust Java Memory**:
   ```bash
   # In minecraft-server/start-server.sh
   java -Xms2G -Xmx4G ...  # Increase for more performance
   ```

4. **Use Lighter AI Models**:
   ```bash
   ollama pull llama2:7b  # Smaller, faster model
   ```

5. **Adjust Polling Intervals** (in `.env`):
   ```
   CHAT_POLL_INTERVAL=2000  # Less frequent checks
   ```

---

## Stopping Services

### Stop Minecraft Server

```bash
./scripts/stop-minecraft.sh
```

Or manually:
```bash
pkill -f fabric-server-launch
```

### Stop Craftbot MCP Server

Press `Ctrl+C` in the terminal running `npm run dev`

### Stop Ollama

```bash
pkill ollama
```

---

## Next Steps

After successful testing:

1. **Customize NPC Personalities**: Edit AI prompts and contexts
2. **Add More NPCs**: Create diverse characters with different roles
3. **Implement Custom Commands**: Extend NPC capabilities
4. **Build Quests**: Create quest systems using AI
5. **Add Voice**: Integrate text-to-speech
6. **Multi-Server**: Scale to multiple Minecraft servers

---

## Support and Resources

- **Documentation**: See `/docs` folder
- **Examples**: See `/examples` folder
- **Architecture**: See `SERVER_ARCHITECTURE.md`
- **Setup Guide**: See `SETUP_GUIDE.md`

---

## Common Test Scenarios

### Scenario 1: Basic Merchant Interaction

1. Spawn Bob the Merchant
2. Greet him: "Hello Bob"
3. Ask about wares: "What do you sell?"
4. Request item: "Can I buy a sword?"
5. Thank him: "Thanks Bob!"

### Scenario 2: Quest NPC

1. Spawn Quest Giver NPC
2. Ask about quests: "Do you have any quests?"
3. Accept quest: "I'll help you"
4. Complete quest objective
5. Return: "I completed the quest"

### Scenario 3: Information NPC

1. Spawn Village Elder
2. Ask about village: "Tell me about this village"
3. Ask about history: "What's the history here?"
4. Ask about directions: "Where can I find the blacksmith?"

### Scenario 4: Combat/Guard NPC

1. Spawn Guard Captain
2. Ask about danger: "Is it safe here?"
3. Ask about enemies: "Are there any threats?"
4. Request help: "Can you protect me?"

---

## Testing Checklist for Releases

Before releasing updates, verify:

- [ ] Fresh installation works
- [ ] All scripts are executable
- [ ] Default configuration works
- [ ] NPCs spawn correctly
- [ ] AI responses are generated
- [ ] Commands are executed
- [ ] Web interface loads
- [ ] RCON connection stable
- [ ] Log monitoring works
- [ ] No memory leaks
- [ ] Documentation is accurate
- [ ] Examples work as expected

---

## Known Issues and Limitations

1. **First AI Response Slow**: Initial Ollama request may take 10-30 seconds
2. **Log File Rotation**: May need to restart if Minecraft rotates logs
3. **RCON Rate Limiting**: Too many commands may be throttled
4. **Entity IDs**: Armor stands don't have persistent IDs across restarts
5. **Name Tag Distance**: Visible within ~64 blocks only

---

## Getting Help

If you encounter issues not covered in this guide:

1. Check existing documentation in `/docs`
2. Review console logs for error messages
3. Verify all prerequisites are installed
4. Try a clean reinstall
5. Check GitHub issues for similar problems

---

**Happy Testing!**

The Craftbot MCP system opens up endless possibilities for AI-powered NPCs in Minecraft. Experiment, have fun, and build amazing experiences!
