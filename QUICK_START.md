# CRAFTBOT MCP - MASTER TESTING CHECKLIST

**START HERE** - Follow this checklist step-by-step to get a fully working Craftbot MCP system.

---

## HOW TO USE THIS CHECKLIST

1. **Follow steps in ORDER** - Do not skip steps
2. **Check the box** when you complete each step
3. **STOP if a step fails** - See troubleshooting section
4. **Expected outputs are provided** - Compare what you see
5. **Read the "What this means" sections** - Understand what's happening

---

## PHASE 0: PREREQUISITES

Before starting, ensure you have these installed:

### Step 0.1: Check Node.js

- [ ] **Run this command:**
```bash
node --version
```

**Expected output:**
```
v18.x.x or higher
```

**What this means:** Node.js is the JavaScript runtime that powers the MCP server.

**STOP if:** Version is below v18.0.0 or command not found.

**Fix:** Install Node.js from https://nodejs.org (use LTS version)

---

### Step 0.2: Check Java (for Minecraft)

- [ ] **Run this command:**
```bash
java -version
```

**Expected output:**
```
openjdk version "17.x.x" or higher
java version "17.x.x" or higher
```

**What this means:** Java is required to run the Minecraft server.

**STOP if:** Version is below 17 or command not found.

**Fix:** Install Java 17+ from https://adoptium.net/

---

### Step 0.3: Check Ollama Installation

- [ ] **Run this command:**
```bash
ollama --version
```

**Expected output:**
```
ollama version is x.x.x
```

**What this means:** Ollama provides local LLM inference for AI NPCs.

**STOP if:** Command not found.

**Fix:** Install Ollama:
- macOS/Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
- Windows: Download from https://ollama.ai/download
- Or visit: https://ollama.ai

---

### Step 0.4: Verify Minecraft Java Edition

- [ ] **Check:** Do you have Minecraft Java Edition installed?

**What this means:** You need the Java Edition (not Bedrock) to connect to the server.

**STOP if:** You only have Bedrock Edition.

**Fix:** Purchase/install Minecraft Java Edition from https://minecraft.net

---

## PHASE 1: INSTALL PROJECT DEPENDENCIES

### Step 1.1: Navigate to Project

- [ ] **Run this command:**
```bash
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
```

**Expected output:**
```
(no output - just changes directory)
```

**What this means:** You're now in the project root directory.

---

### Step 1.2: Install Node Dependencies

- [ ] **Run this command:**
```bash
npm install
```

**Expected output:**
```
added XXX packages in XXs

XXX packages are looking for funding
  run `npm fund` for details
```

**What this means:** This downloads all required Node.js packages (Express, WebSocket, RCON client, etc.)

**STOP if:** Errors about missing dependencies or permission denied.

**Fix:**
- Permission errors: Try `sudo npm install` (not recommended) or fix npm permissions
- Network errors: Check internet connection
- Package errors: Delete `node_modules` and `package-lock.json`, try again

---

### Step 1.3: Pull Ollama Model

- [ ] **Run this command:**
```bash
ollama pull llama2
```

**Expected output:**
```
pulling manifest
pulling xxx... 100%
pulling yyy... 100%
verifying sha256 digest
success
```

**What this means:** Downloads the LLM model that will power your AI NPCs.

**Alternative models:** You can also use:
- `ollama pull qwen2.5:14b-instruct` (better quality, requires more RAM)
- `ollama pull mistral` (faster, less resource intensive)
- `ollama pull phi` (smallest, good for testing)

**STOP if:** Download fails or insufficient disk space.

**Fix:**
- Check internet connection
- Free up disk space (models are 3-7GB)
- Try a smaller model like `phi`

---

### Step 1.4: Verify Ollama Model

- [ ] **Run this command:**
```bash
ollama list
```

**Expected output:**
```
NAME                    ID              SIZE      MODIFIED
llama2:latest          abc123def456    3.8 GB    X minutes ago
```

**What this means:** Confirms the model is downloaded and ready to use.

---

## PHASE 2: SETUP MINECRAFT SERVER (OPTIONAL)

**Note:** If you already have a Minecraft server running, skip to Step 2.6 and just verify RCON settings.

### Step 2.1: Create Server Directory

- [ ] **Run this command:**
```bash
mkdir -p ~/minecraft-server && cd ~/minecraft-server
```

**Expected output:**
```
(no output - directory created)
```

**What this means:** Creates a dedicated folder for your Minecraft server.

---

### Step 2.2: Download Minecraft Server

- [ ] **Visit:** https://www.minecraft.net/en-us/download/server

- [ ] **Download the latest server JAR file**

- [ ] **Move it to the minecraft-server directory:**
```bash
mv ~/Downloads/server.jar ~/minecraft-server/
```

**Alternative (Fabric mod support):**
```bash
# Download Fabric installer from https://fabricmc.net/use/installer/
# Run the installer and select server installation
```

---

### Step 2.3: Accept EULA

- [ ] **First run (will fail but creates eula.txt):**
```bash
cd ~/minecraft-server
java -Xmx2G -jar server.jar nogui
```

- [ ] **Edit eula.txt:**
```bash
echo "eula=true" > eula.txt
```

**What this means:** You're accepting Minecraft's End User License Agreement.

---

### Step 2.4: Configure RCON

- [ ] **Create/edit server.properties:**
```bash
nano server.properties
```

- [ ] **Add/modify these lines:**
```properties
enable-rcon=true
rcon.port=25575
rcon.password=minecraft123
broadcast-rcon-to-ops=true
```

**IMPORTANT:** Remember the password you set - you'll need it later!

**Save:** Ctrl+O, Enter, Ctrl+X

**What this means:** RCON (Remote Console) allows the MCP server to send commands to Minecraft.

---

### Step 2.5: Start Minecraft Server

- [ ] **Run this command:**
```bash
cd ~/minecraft-server
java -Xmx4G -Xms2G -jar server.jar nogui
```

**Expected output:**
```
[XX:XX:XX] [Server thread/INFO]: Starting minecraft server version 1.20.x
[XX:XX:XX] [Server thread/INFO]: Loading properties
[XX:XX:XX] [Server thread/INFO]: Default game type: SURVIVAL
...
[XX:XX:XX] [Server thread/INFO]: Done (XXs)! For help, type "help"
[XX:XX:XX] [RCON Listener #1/INFO]: RCON running on 0.0.0.0:25575
```

**What this means:** Minecraft server is running and RCON is enabled.

**Look for:** The line about "RCON running" - this confirms RCON is active.

**STOP if:** Server crashes, errors about ports in use, or "RCON running" line is missing.

**Fix:**
- Port in use: Another server is running, stop it first
- Out of memory: Reduce -Xmx value (e.g., -Xmx2G)
- RCON missing: Check server.properties, restart server

---

### Step 2.6: Test RCON Connection (Verification)

- [ ] **Open a NEW terminal (keep server running in first terminal)**

- [ ] **Test RCON with curl:**
```bash
# This should work if RCON is properly configured
# We'll test it properly when the MCP server starts
```

**What this means:** We'll verify RCON when we start the MCP server in Phase 4.

---

### Step 2.7: Note Minecraft Log Path

- [ ] **Find your log path:**
```bash
ls -la ~/minecraft-server/logs/latest.log
```

**Expected output:**
```
-rw-r--r-- 1 user user XXXX Oct  1 XX:XX /Users/you/minecraft-server/logs/latest.log
```

**IMPORTANT:** Write down this FULL path - you'll need it for .env configuration!

**Your log path:** `___________________________________`

---

## PHASE 3: CONFIGURE ENVIRONMENT

### Step 3.1: Navigate to Project

- [ ] **Run this command:**
```bash
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
```

---

### Step 3.2: Copy Environment Template

- [ ] **Run this command:**
```bash
cp .env.example .env
```

**Expected output:**
```
(no output - file copied)
```

**What this means:** Creates your personal configuration file from the template.

---

### Step 3.3: Edit .env File

- [ ] **Open .env for editing:**
```bash
nano .env
```

- [ ] **Configure these values:**

```env
# Frontend Configuration
VITE_API_URL=http://localhost:3000/api

# Backend Server Configuration
SERVER_PORT=3000

# Minecraft RCON Configuration
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=minecraft123    # <-- CHANGE THIS to match your server.properties!

# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=llama2           # <-- Use the model you pulled (llama2, mistral, etc.)

# Minecraft Server Configuration
MC_LOG_PATH=/Users/YOUR_USERNAME/minecraft-server/logs/latest.log  # <-- CHANGE THIS!

# Chat Monitor Configuration
CHAT_POLL_INTERVAL=1000
COMMAND_QUEUE_DELAY=100

# State Cache Configuration
STATE_CACHE_TTL=5000
```

**CRITICAL - YOU MUST CHANGE:**
1. `RCON_PASSWORD` - Must match your server.properties password EXACTLY
2. `MC_LOG_PATH` - Full path to your Minecraft server's latest.log file
3. `OLLAMA_MODEL` - The model name you pulled (llama2, mistral, phi, etc.)

**Save:** Ctrl+O, Enter, Ctrl+X

**What this means:** These settings tell the MCP server how to connect to Minecraft and Ollama.

---

### Step 3.4: Verify .env File

- [ ] **Check your configuration:**
```bash
cat .env | grep -E "(RCON_PASSWORD|MC_LOG_PATH|OLLAMA_MODEL)"
```

**Expected output:**
```
RCON_PASSWORD=minecraft123
MC_LOG_PATH=/Users/you/minecraft-server/logs/latest.log
OLLAMA_MODEL=llama2
```

**What this means:** Confirms your critical settings are configured.

**STOP if:** Any values are still "your_password_here" or "/path/to/".

---

## PHASE 4: START SERVICES

### Step 4.1: Start Ollama Service

**Check if already running:**

- [ ] **Run this command:**
```bash
curl http://localhost:11434/api/tags
```

**If you get a response:** Ollama is already running, skip to Step 4.2.

**If connection refused:**

- [ ] **Start Ollama:**
```bash
ollama serve
```

**Expected output:**
```
Listening on 127.0.0.1:11434
```

**What this means:** Ollama is now running and ready to process LLM requests.

**Keep this terminal open** - Let Ollama run in the background.

---

### Step 4.2: Verify Ollama is Responding

- [ ] **Open a NEW terminal and run:**
```bash
curl http://localhost:11434/api/tags
```

**Expected output:**
```json
{
  "models": [
    {
      "name": "llama2:latest",
      "modified_at": "2025-10-01T...",
      "size": 3826793677,
      ...
    }
  ]
}
```

**What this means:** Ollama is running and has your model loaded.

**STOP if:** Connection refused or empty models array.

**Fix:**
- Connection refused: Start Ollama (step 4.1)
- No models: Pull a model with `ollama pull llama2`

---

### Step 4.3: Start MCP Backend Server

- [ ] **Open a NEW terminal**

- [ ] **Navigate to project:**
```bash
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
```

- [ ] **Start the server:**
```bash
npm run server
```

**Expected output:**
```
[YYYY-MM-DD HH:MM:SS] MCP Server starting...
[YYYY-MM-DD HH:MM:SS] Connecting to RCON at localhost:25575...
[YYYY-MM-DD HH:MM:SS] RCON connected successfully
[YYYY-MM-DD HH:MM:SS] Starting chat monitor...
[YYYY-MM-DD HH:MM:SS] Chat monitor watching: /Users/you/minecraft-server/logs/latest.log
[YYYY-MM-DD HH:MM:SS] MCP Server listening on port 3000
[YYYY-MM-DD HH:MM:SS] WebSocket server ready
```

**What this means:** The MCP server is running and connected to both Minecraft (via RCON) and ready to process chat.

**STOP if you see:**
- "RCON connection failed" - Check RCON password in .env
- "Cannot read log file" - Check MC_LOG_PATH in .env
- "Port 3000 already in use" - Stop other server using port 3000

**Fix:**
- RCON errors: Verify Minecraft server is running, check password
- Log file errors: Verify path, check file permissions
- Port errors: Change SERVER_PORT in .env or stop conflicting service

**Keep this terminal open** - This is your server log viewer.

---

### Step 4.4: Verify MCP Server Health

- [ ] **Open a NEW terminal and run:**
```bash
curl http://localhost:3000/api/health
```

**Expected output:**
```json
{
  "status": "ok",
  "rcon": true,
  "ollama": "unknown",
  "timestamp": "2025-10-01T..."
}
```

**What this means:** MCP server is running and RCON is connected.

**STOP if:** Connection refused or "rcon": false.

**Fix:**
- Connection refused: MCP server not running (step 4.3)
- "rcon": false: Check Minecraft server is running, verify RCON settings

---

### Step 4.5: Test Ollama Integration

- [ ] **Run this command:**
```bash
curl http://localhost:3000/api/ollama/health
```

**Expected output:**
```json
{
  "success": true,
  "status": 200,
  "available": true
}
```

**What this means:** MCP server can communicate with Ollama.

**STOP if:** "available": false or error.

**Fix:**
- Verify Ollama is running (step 4.1)
- Check OLLAMA_URL in .env

---

### Step 4.6: Start Frontend Dev Server

- [ ] **Open a NEW terminal**

- [ ] **Navigate to project:**
```bash
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
```

- [ ] **Start frontend:**
```bash
npm run dev
```

**Expected output:**
```
VITE v6.0.3  ready in XXX ms

➜  Local:   http://localhost:5173/
➜  Network: use --host to expose
➜  press h + enter to show help
```

**What this means:** Frontend development server is running.

**STOP if:** Port 5173 already in use.

**Fix:** Stop other Vite server or change port in vite.config.js

**Keep this terminal open** - Frontend logs appear here.

---

### Step 4.7: Verify Frontend

- [ ] **Open your browser to:** http://localhost:5173

**Expected view:**
- Should see Craftbot MCP interface
- Liquid ether background animation
- Sidebar with navigation
- Connection status indicator

**What this means:** Frontend is running and loaded successfully.

**STOP if:** Blank page, 404, or cannot connect.

**Fix:**
- Check frontend terminal for errors
- Hard refresh browser (Cmd+Shift+R or Ctrl+Shift+R)
- Check browser console for errors (F12)

---

## PHASE 5: CONNECT TO MINECRAFT

### Step 5.1: Launch Minecraft Client

- [ ] **Open Minecraft Java Edition**

- [ ] **Click "Multiplayer"**

- [ ] **Click "Add Server"**

**What this means:** You're setting up a connection to your local server.

---

### Step 5.2: Add Server

- [ ] **Server Name:** `Craftbot Test Server`

- [ ] **Server Address:** `localhost`

- [ ] **Click "Done"**

**What this means:** Saves the server to your multiplayer list.

---

### Step 5.3: Join Server

- [ ] **Click on the server in your list**

- [ ] **Click "Join Server"**

**Expected result:**
- World loads
- You spawn in the Minecraft world
- Server is responsive

**What this means:** You're now connected to your Minecraft server.

**STOP if:** Cannot connect, "Connection refused", or timeout.

**Fix:**
- Verify Minecraft server is running (check terminal from Phase 2)
- Check server hasn't crashed
- Verify server.properties has correct settings

---

### Step 5.4: Verify Chat Detection

- [ ] **In Minecraft chat (press T), type:**
```
Hello world, this is a test!
```

- [ ] **Check the MCP server terminal**

**Expected in MCP logs:**
```
[YYYY-MM-DD HH:MM:SS] [Chat Monitor] Detected message: <YourUsername> Hello world, this is a test!
```

**What this means:** MCP server is successfully reading Minecraft chat from the log file.

**STOP if:** No message appears in MCP logs.

**Fix:**
- Check MC_LOG_PATH in .env
- Verify log file is being written: `tail -f ~/minecraft-server/logs/latest.log`
- Check file permissions
- Restart MCP server

---

## PHASE 6: TEST FRONTEND CONNECTION

### Step 6.1: Check Connection Status

- [ ] **In your browser (http://localhost:5173), look for connection indicator**

**Expected:**
- Green dot or "Connected" status
- No error messages

**What this means:** Frontend is connected to backend via WebSocket.

**STOP if:** Red dot, "Disconnected", or errors.

**Fix:**
- Verify MCP server is running (step 4.3)
- Check browser console (F12) for errors
- Hard refresh browser

---

### Step 6.2: View Entities List

- [ ] **Click "Entities" in sidebar**

**Expected:**
- Should see at least one entity (usually "console" entity from default config)
- Entity shows name, type, and status

**What this means:** Frontend can fetch entity data from backend.

---

### Step 6.3: View Logs

- [ ] **Click "Logs" or "Monitor" in sidebar**

**Expected:**
- List of recent log messages
- Should see your "Hello world" test message
- Timestamps and log types

**What this means:** Frontend is receiving log data from backend.

---

## PHASE 7: CREATE AND TEST AI ENTITY

### Step 7.1: Create Console Entity (if not exists)

- [ ] **In frontend, click "Entities"**

- [ ] **Click "Add Entity" or verify "console" entity exists**

- [ ] **If creating new, configure:**

```
Name: console
Type: console
Enabled: ✓ (checked)

Permissions:
  Level: admin
  Can Execute Commands: ✓ (checked)
  Whitelisted Commands: * (or leave empty for all)
  Blacklisted Commands: (empty)

Knowledge:
  Can Access Player State: ✓ (all)
  Can Access World State: ✓ (all)
  Proximity Required: ✗ (unchecked)

Personality:
  System Prompt: You are a helpful Minecraft server assistant. You can see game state and execute commands to help players.
  Conversation History Limit: 50

LLM:
  Model: llama2 (or your model)
  Enabled: ✓ (checked)
  Temperature: 0.7
```

- [ ] **Click "Save"**

**What this means:** Creates an AI entity that can respond to all chat messages.

---

### Step 7.2: Test Basic Interaction

- [ ] **In Minecraft, type in chat:**
```
Hello console, can you hear me?
```

- [ ] **Watch the MCP server terminal**

**Expected MCP server logs:**
```
[YYYY-MM-DD HH:MM:SS] [Chat Monitor] Detected message: <YourUsername> Hello console, can you hear me?
[YYYY-MM-DD HH:MM:SS] [Conversation Queue] Added message to queue for entity: console
[YYYY-MM-DD HH:MM:SS] [LLM Client] Sending prompt to Ollama (model: llama2)...
[YYYY-MM-DD HH:MM:SS] [LLM Client] Received response from Ollama
[YYYY-MM-DD HH:MM:SS] [LLM Parser] Parsing XML response...
[YYYY-MM-DD HH:MM:SS] [LLM Parser] Found <say> tag: "Hello! Yes, I can hear you..."
[YYYY-MM-DD HH:MM:SS] [RCON] Executing: say [AI] <console> Hello! Yes, I can hear you...
```

- [ ] **Check Minecraft chat**

**Expected in Minecraft:**
```
[AI] <console> Hello! Yes, I can hear you. How can I help you today?
```

**What this means:** Full pipeline is working:
1. Chat detected
2. Sent to LLM
3. LLM generated response
4. Response parsed
5. Sent back to Minecraft

**STOP if:** No response appears after 10-30 seconds.

**Troubleshooting:**
- **No detection:** Check Phase 5.4, verify chat monitor
- **No LLM call:** Check entity is enabled, LLM enabled
- **LLM error:** Check Ollama is running, model is correct
- **No Minecraft response:** Check RCON connection

---

### Step 7.3: Test Command Execution

- [ ] **In Minecraft, type in chat:**
```
console, can you give me a diamond?
```

**Expected MCP server logs:**
```
[YYYY-MM-DD HH:MM:SS] [Chat Monitor] Detected message: <YourUsername> console, can you give me a diamond?
[YYYY-MM-DD HH:MM:SS] [LLM Client] Sending prompt to Ollama...
[YYYY-MM-DD HH:MM:SS] [LLM Parser] Found <function> tag: give YourUsername diamond 1
[YYYY-MM-DD HH:MM:SS] [Command Validator] Validating command: give YourUsername diamond 1
[YYYY-MM-DD HH:MM:SS] [Command Validator] Command allowed (entity has admin permission)
[YYYY-MM-DD HH:MM:SS] [RCON] Executing: give YourUsername diamond 1
[YYYY-MM-DD HH:MM:SS] [LLM Parser] Found <say> tag: "I've given you a diamond!"
[YYYY-MM-DD HH:MM:SS] [RCON] Executing: say [AI] <console> I've given you a diamond!
```

**Expected in Minecraft:**
- You receive 1 diamond in your inventory
- Chat shows: `[AI] <console> I've given you a diamond!`

**What this means:** The LLM can generate commands, they're validated, and executed in-game.

**STOP if:** No diamond received or command rejected.

**Troubleshooting:**
- Command rejected: Check entity permissions
- No command in logs: LLM might not have generated <function> tag
- Syntax error: Check minecraft-commands.csv for command format

---

### Step 7.4: Test Conversation History

- [ ] **Have a short conversation:**

```
You: console, my name is Steve
console: Nice to meet you, Steve!

You: what is my name?
console: Your name is Steve!
```

**What this means:** The entity remembers previous messages in the conversation.

---

## PHASE 8: TEST NPC ENTITY (PROXIMITY-BASED)

### Step 8.1: Create NPC Entity

- [ ] **In frontend, click "Add Entity"**

- [ ] **Configure:**

```
Name: merchant
Type: npc
Enabled: ✓

Permissions:
  Level: user
  Can Execute Commands: ✓
  Whitelisted Commands: say,tell,give
  Blacklisted Commands: (empty)

Knowledge:
  Can Access Player State: ✓ position, inventory
  Can Access World State: ✓ time
  Proximity Required: ✓ (checked)
  Max Proximity: 10 (blocks)

Personality:
  System Prompt: You are a friendly merchant NPC. You sell items to nearby players and enjoy chatting about trades.
  Conversation History Limit: 30

LLM:
  Model: llama2
  Enabled: ✓
  Temperature: 0.8

Appearance:
  Position X: 100
  Position Y: 64
  Position Z: 200
```

- [ ] **Save the entity**

**What this means:** Creates an NPC that only responds when players are within 10 blocks.

---

### Step 8.2: Test Proximity (Far Away)

- [ ] **In Minecraft, teleport far from NPC:**
```
/tp @s 0 64 0
```

- [ ] **Try to talk to merchant:**
```
Hello merchant, are you there?
```

**Expected:** No response (you're too far away)

**What this means:** Proximity requirement is working.

---

### Step 8.3: Test Proximity (Close)

- [ ] **Teleport near NPC:**
```
/tp @s 100 64 200
```

- [ ] **Talk to merchant:**
```
Hello merchant!
```

**Expected:**
```
[AI] <merchant> Greetings, traveler! Welcome to my shop!
```

**What this means:** NPC only responds when you're close enough.

---

## PHASE 9: TEST PERMISSION SYSTEM

### Step 9.1: Create Read-Only Entity

- [ ] **Create new entity:**

```
Name: observer
Type: console
Enabled: ✓

Permissions:
  Level: readonly
  Can Execute Commands: ✓
  Whitelisted Commands: say
  Blacklisted Commands: give,kill,tp
```

- [ ] **Save**

---

### Step 9.2: Test Forbidden Command

- [ ] **In Minecraft:**
```
observer, give me a diamond
```

**Expected MCP logs:**
```
[Command Validator] Command REJECTED: give not in whitelist
[LLM Parser] Command validation failed, skipping execution
```

**Expected in Minecraft:**
```
[AI] <observer> I'm sorry, but I don't have permission to give items.
```

**What this means:** Permission system prevents unauthorized commands.

---

## PHASE 10: VERIFY COMPLETE SYSTEM

### Step 10.1: Final System Check

- [ ] **All services running:**
  - Ollama: http://localhost:11434
  - MCP Server: http://localhost:3000
  - Frontend: http://localhost:5173
  - Minecraft Server: Running in terminal

- [ ] **All connections working:**
  - RCON: Connected
  - Ollama: Responding
  - WebSocket: Connected
  - Chat Monitor: Detecting messages

- [ ] **All features working:**
  - Chat detection ✓
  - LLM responses ✓
  - Command execution ✓
  - Permission validation ✓
  - Conversation history ✓
  - Proximity checking ✓

**What this means:** You have a fully functional Craftbot MCP system!

---

## TROUBLESHOOTING GUIDE

### Issue: "RCON Connection Failed"

**Symptoms:**
```
[ERROR] RCON connection failed: Connection refused
```

**Check:**
1. Is Minecraft server running? `ps aux | grep minecraft`
2. Is RCON enabled in server.properties? `grep rcon ~/minecraft-server/server.properties`
3. Does password in .env match server.properties?
4. Is port 25575 accessible? `lsof -i :25575`

**Fix:**
```bash
# 1. Verify server is running
cd ~/minecraft-server
java -Xmx4G -jar server.jar nogui

# 2. Check server.properties
cat server.properties | grep rcon

# 3. Update .env
nano /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env
# Set RCON_PASSWORD to match server.properties

# 4. Restart MCP server
```

---

### Issue: "Cannot Read Log File"

**Symptoms:**
```
[ERROR] Cannot read log file: /path/to/logs/latest.log
```

**Check:**
1. Does the log file exist? `ls -la /path/to/logs/latest.log`
2. Can you read it? `cat /path/to/logs/latest.log`
3. Is the path in .env correct?

**Fix:**
```bash
# 1. Find correct log path
find ~ -name "latest.log" -path "*/minecraft*/logs/*"

# 2. Update .env
nano /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/.env
# Set MC_LOG_PATH to correct path

# 3. Restart MCP server
```

---

### Issue: "Ollama Connection Failed"

**Symptoms:**
```
[ERROR] Ollama request failed: ECONNREFUSED
```

**Check:**
1. Is Ollama running? `ps aux | grep ollama`
2. Is it listening on port 11434? `lsof -i :11434`
3. Is the model pulled? `ollama list`

**Fix:**
```bash
# 1. Start Ollama
ollama serve

# 2. Pull model (if needed)
ollama pull llama2

# 3. Test connection
curl http://localhost:11434/api/tags

# 4. Restart MCP server
```

---

### Issue: "Entity Not Responding"

**Symptoms:**
- Chat messages detected but no response

**Check:**
1. Is entity enabled? (Check frontend)
2. Is LLM enabled for entity? (Check entity.llm.enabled)
3. Is Ollama responding? `curl http://localhost:11434/api/tags`
4. Check MCP server logs for errors

**Debug:**
```bash
# Check entity status
curl http://localhost:3000/api/entities | grep -A 10 "console"

# Check Ollama health
curl http://localhost:3000/api/ollama/health

# Check recent logs
curl http://localhost:3000/api/logs | tail -20
```

---

### Issue: "Commands Not Executing"

**Symptoms:**
- Entity responds but commands don't work

**Check:**
1. Does entity have permission? (Check entity.permissions.canExecuteCommands)
2. Is command in whitelist? (Check entity.permissions.whitelistedCommands)
3. Is command blacklisted? (Check entity.permissions.blacklistedCommands)
4. Check validation logs

**Debug:**
```bash
# Test command validation
curl -X POST http://localhost:3000/api/commands/validate \
  -H "Content-Type: application/json" \
  -d '{"command": "give Steve diamond 1", "entityId": "console"}'
```

---

### Issue: "Frontend Not Connecting"

**Symptoms:**
- Red "Disconnected" indicator
- WebSocket errors in console

**Check:**
1. Is MCP server running? `curl http://localhost:3000/api/health`
2. Is port 3000 accessible?
3. Check browser console (F12) for errors
4. Check VITE_API_URL in .env

**Fix:**
```bash
# 1. Verify MCP server
curl http://localhost:3000/api/health

# 2. Restart frontend
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run dev

# 3. Hard refresh browser (Cmd+Shift+R)
```

---

## COMMON LOG MESSAGES EXPLAINED

### Normal Operation

```
[Chat Monitor] Detected message: <Player> hello
```
**Meaning:** Chat message successfully detected from log file.
**Action:** None - working as expected.

---

```
[Conversation Queue] Added message to queue for entity: console
```
**Meaning:** Message added to entity's processing queue.
**Action:** None - working as expected.

---

```
[LLM Client] Sending prompt to Ollama (model: llama2)...
```
**Meaning:** Sending request to LLM for response generation.
**Action:** None - working as expected.

---

```
[LLM Parser] Found <say> tag: "Hello there!"
```
**Meaning:** LLM generated a chat response.
**Action:** None - working as expected.

---

```
[Command Validator] Command allowed
```
**Meaning:** Command passed validation and will execute.
**Action:** None - working as expected.

---

```
[RCON] Executing: say [AI] <console> Hello!
```
**Meaning:** Sending command to Minecraft via RCON.
**Action:** None - working as expected.

---

### Warning Messages

```
[WARNING] Entity 'merchant' proximity check failed (player too far)
```
**Meaning:** Player is outside proximity range for NPC.
**Action:** This is expected behavior for proximity-based NPCs.

---

```
[WARNING] Command validation failed: command not in whitelist
```
**Meaning:** LLM tried to execute forbidden command.
**Action:** Permission system working correctly. Check if you want to allow this command.

---

```
[WARNING] Conversation history truncated (limit: 50)
```
**Meaning:** Old messages removed to stay within history limit.
**Action:** Normal behavior. Increase limit if needed.

---

### Error Messages

```
[ERROR] RCON connection failed
```
**Meaning:** Cannot connect to Minecraft server.
**Action:** Check Minecraft server is running, verify RCON settings.

---

```
[ERROR] Ollama request failed: ECONNREFUSED
```
**Meaning:** Cannot connect to Ollama.
**Action:** Start Ollama with `ollama serve`.

---

```
[ERROR] Failed to parse LLM response
```
**Meaning:** LLM returned malformed XML.
**Action:** Usually temporary. Check Ollama logs. May need to retry.

---

```
[ERROR] Command validation failed: insufficient permissions
```
**Meaning:** Entity tried to execute command without permission.
**Action:** Review entity permissions. May need to adjust.

---

## QUICK RESTART PROCEDURES

### Restart Everything

```bash
# Stop all (Ctrl+C in each terminal)

# 1. Start Ollama
ollama serve

# 2. Start Minecraft Server
cd ~/minecraft-server
java -Xmx4G -jar server.jar nogui

# 3. Start MCP Server
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run server

# 4. Start Frontend
cd /Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp
npm run dev
```

---

### Restart Just MCP Server

```bash
# Ctrl+C in MCP server terminal
npm run server
```

---

### Restart Just Frontend

```bash
# Ctrl+C in frontend terminal
npm run dev
```

---

## EMERGENCY STOP

### Stop All Services

```bash
# Stop MCP server
pkill -f "node.*mcp-server"

# Stop frontend
pkill -f "vite"

# Stop Ollama
pkill -f "ollama"

# Stop Minecraft server
pkill -f "minecraft.*server"
```

---

## SUCCESS CRITERIA

You've successfully completed setup when:

- [ ] All 4 services are running (Ollama, Minecraft, MCP Server, Frontend)
- [ ] Chat messages are detected in MCP logs
- [ ] At least one entity responds to your messages
- [ ] Commands execute successfully in Minecraft
- [ ] Frontend shows green "Connected" status
- [ ] You can see conversation logs in the frontend

**Congratulations! Your Craftbot MCP system is fully operational!**

---

## NEXT STEPS

1. **Read** `/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/QUICK_REFERENCE.md` for command reference
2. **Experiment** with different entity personalities
3. **Create** custom NPCs with unique permissions
4. **Monitor** logs to understand system behavior
5. **Customize** command permissions in minecraft-commands.csv

---

## SUPPORT RESOURCES

- **Architecture docs:** `/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/SERVER_ARCHITECTURE.md`
- **API reference:** `/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/architecture.md`
- **LLM guide:** `/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/llm-architecture.md`
- **XML tags:** `/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/docs/xml-tag-reference.md`

---

**Last updated:** 2025-10-01
**Version:** 1.0.0
