# Craftbot MCP Troubleshooting Guide

This guide helps diagnose and fix common issues with the Craftbot MCP system.

## Table of Contents

1. [Quick Diagnostics](#quick-diagnostics)
2. [Frontend Issues](#frontend-issues)
3. [WebSocket Issues](#websocket-issues)
4. [RCON Issues](#rcon-issues)
5. [Ollama/LLM Issues](#ollamallm-issues)
6. [NPC Not Responding](#npc-not-responding)
7. [Command Validation Issues](#command-validation-issues)
8. [Performance Issues](#performance-issues)
9. [Common Error Messages](#common-error-messages)

---

## Quick Diagnostics

Before diving into specific issues, run these diagnostic tools:

```bash
# Pre-flight check (checks system requirements)
npm run preflight

# Health check (tests all endpoints)
npm run test:health

# Integration tests (full system test)
npm run test:integration

# View logs in real-time
npm run debug
```

### System Status Quick Check

```bash
# Check if MCP server is running
lsof -i :3000

# Check if Ollama is running
curl -s http://localhost:11434/api/tags

# Check if Minecraft RCON is accessible
nc -zv localhost 25575

# Check Node.js version (needs 18+)
node -v
```

---

## Frontend Issues

### Problem: Frontend Won't Load

**Symptoms:**
- Browser shows "Cannot GET /" or blank page
- Vite dev server won't start
- Port 5173 shows errors

**Diagnostic Steps:**

1. **Check if Vite is running:**
   ```bash
   lsof -i :5173
   ```

2. **Check for port conflicts:**
   ```bash
   # Kill any process on port 5173
   lsof -ti :5173 | xargs kill -9
   ```

3. **Verify dependencies:**
   ```bash
   npm run preflight
   # Look for missing node_modules or package issues
   ```

**Solutions:**

✓ **Install dependencies:**
```bash
npm install
```

✓ **Clear Vite cache:**
```bash
rm -rf node_modules/.vite
npm run dev
```

✓ **Check firewall settings:**
- Make sure port 5173 is not blocked
- Try accessing `http://localhost:5173` directly

✓ **Check browser console:**
- Open DevTools (F12)
- Look for JavaScript errors
- Check Network tab for failed requests

### Problem: Frontend Loads but Shows Connection Error

**Symptoms:**
- UI appears but shows "Disconnected" status
- API calls fail with network errors

**Diagnostic Steps:**

1. **Check backend server:**
   ```bash
   npm run test:health
   # Should show all endpoints responding
   ```

2. **Verify API URL configuration:**
   ```bash
   grep VITE_API_URL .env
   # Should be: VITE_API_URL=http://localhost:3000/api
   ```

**Solutions:**

✓ **Start backend server:**
```bash
npm run server
# Or run both together:
npm run dev:full
```

✓ **Fix .env configuration:**
```bash
# In .env file:
VITE_API_URL=http://localhost:3000/api
```

✓ **Check CORS issues:**
- Backend should have CORS enabled for frontend origin
- Check server logs for CORS errors

---

## WebSocket Issues

### Problem: WebSocket Won't Connect

**Symptoms:**
- "WebSocket connection failed" in logs
- Real-time updates not working
- Connection status shows disconnected

**Diagnostic Steps:**

1. **Test WebSocket manually:**
   ```bash
   # Using websocat (install with: brew install websocat)
   websocat ws://localhost:3000

   # Should receive connection confirmation message
   ```

2. **Check server logs:**
   ```bash
   npm run debug
   # Look for "[WebSocket] Client connected" messages
   ```

**Solutions:**

✓ **Restart MCP server:**
```bash
# Stop server (Ctrl+C)
npm run server
```

✓ **Check WebSocket configuration:**
```javascript
// In frontend code, verify WebSocket URL:
const ws = new WebSocket('ws://localhost:3000');
```

✓ **Verify no proxy interference:**
- If using a proxy, it might not support WebSocket upgrades
- Try connecting without proxy
- Check if firewall blocks WebSocket connections

✓ **Browser compatibility:**
- Ensure browser supports WebSockets (all modern browsers do)
- Check browser console for specific errors

### Problem: WebSocket Connects but Drops Frequently

**Symptoms:**
- Connection established but disconnects after few seconds
- "Connection closed" messages in logs

**Solutions:**

✓ **Check for timeout issues:**
```javascript
// Implement ping/pong keep-alive
// Server should send periodic heartbeat messages
```

✓ **Monitor network stability:**
```bash
# Check for packet loss
ping localhost
```

✓ **Increase timeout values:**
```javascript
// In server configuration
const wss = new WebSocketServer({
  server: this.server,
  clientTracking: true,
  perMessageDeflate: false
});
```

---

## RCON Issues

### Problem: RCON Connection Failed

**Symptoms:**
- "Failed to connect to RCON" in logs
- Commands not executing on Minecraft server
- Health check shows RCON: disconnected

**Diagnostic Steps:**

1. **Verify Minecraft server is running:**
   ```bash
   # Check if server is running
   ps aux | grep minecraft

   # Check RCON port is open
   nc -zv localhost 25575
   ```

2. **Test RCON credentials:**
   ```bash
   # Check .env configuration
   grep RCON .env
   ```

3. **Check Minecraft server.properties:**
   ```properties
   # Must have these settings:
   enable-rcon=true
   rcon.port=25575
   rcon.password=your_password_here
   ```

**Solutions:**

✓ **Enable RCON in Minecraft:**
```properties
# In server.properties:
enable-rcon=true
rcon.port=25575
rcon.password=craftbot_rcon_pass
```

✓ **Update .env file:**
```bash
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=craftbot_rcon_pass
```

✓ **Restart Minecraft server:**
- Stop the Minecraft server
- Verify server.properties changes
- Start server again
- Wait for "Done" message before testing

✓ **Check firewall:**
```bash
# On Linux, allow RCON port:
sudo ufw allow 25575/tcp

# On macOS, check System Preferences > Security & Privacy > Firewall
```

### Problem: RCON Commands Not Executing

**Symptoms:**
- Connection successful but commands fail
- "Command executed" but no effect in game

**Diagnostic Steps:**

1. **Test command directly:**
   ```bash
   # Try a simple command
   # The response should show the command result
   ```

2. **Check command validation:**
   ```bash
   npm run test:integration
   # Look at Command Validator test results
   ```

**Solutions:**

✓ **Verify command syntax:**
```javascript
// Commands should NOT include leading slash for RCON
// Correct: "time set day"
// Incorrect: "/time set day"
```

✓ **Check command permissions:**
- Verify command is in minecraft-commands.csv
- Check entity permissions allow the command

✓ **Test with simple commands:**
```javascript
// Start with basic commands:
await rconClient.sendCommand('list');
await rconClient.sendCommand('time query daytime');
```

---

## Ollama/LLM Issues

### Problem: Ollama Not Accessible

**Symptoms:**
- "Ollama is not accessible" error
- LLM requests timeout
- Health check shows Ollama unavailable

**Diagnostic Steps:**

1. **Check if Ollama is running:**
   ```bash
   curl http://localhost:11434/api/tags
   # Should return JSON with model list
   ```

2. **Check Ollama process:**
   ```bash
   ps aux | grep ollama
   ```

**Solutions:**

✓ **Start Ollama:**
```bash
ollama serve
# Or on macOS, Ollama runs automatically if installed
```

✓ **Install Ollama:**
```bash
# macOS/Linux:
curl -fsSL https://ollama.com/install.sh | sh

# Or download from: https://ollama.com/download
```

✓ **Verify Ollama URL:**
```bash
# Check .env configuration:
OLLAMA_URL=http://localhost:11434
```

✓ **Check Ollama logs:**
```bash
# On macOS:
tail -f ~/.ollama/logs/server.log

# On Linux:
journalctl -u ollama -f
```

### Problem: Model Not Found

**Symptoms:**
- "Model 'model-name' not found" error
- LLM requests fail with 404

**Diagnostic Steps:**

1. **List available models:**
   ```bash
   ollama list
   ```

2. **Check configured model:**
   ```bash
   grep OLLAMA_MODEL .env
   ```

**Solutions:**

✓ **Pull the required model:**
```bash
# For Craftbot, recommended model:
ollama pull qwen2.5:14b-instruct

# Or use a smaller model for testing:
ollama pull llama2
```

✓ **Update .env with available model:**
```bash
# Use a model you have installed:
OLLAMA_MODEL=qwen2.5:14b-instruct
```

✓ **Verify model download:**
```bash
ollama list
# Should show your model in the list
```

### Problem: LLM Responses Are Slow

**Symptoms:**
- Requests take 30+ seconds
- Timeout errors
- Poor performance

**Solutions:**

✓ **Use a smaller model:**
```bash
# Switch to a faster model:
ollama pull llama2:7b
# Update .env:
OLLAMA_MODEL=llama2:7b
```

✓ **Reduce context length:**
```javascript
// In entity configuration, limit conversation history:
conversationQueue.buildFullContext(entity, 10); // Instead of 20
```

✓ **Increase timeout:**
```javascript
// In server/ollama-client.js:
this.timeout = 120000; // 2 minutes instead of 60 seconds
```

✓ **Check system resources:**
```bash
# Monitor CPU/RAM usage:
top
# Ollama is CPU/RAM intensive, ensure sufficient resources
```

---

## NPC Not Responding

### Problem: NPC Doesn't Respond to Chat

**Symptoms:**
- Players send messages but NPC doesn't reply
- No response in chat or logs
- Chat monitor shows messages but no LLM processing

**Diagnostic Steps:**

1. **Check entity configuration:**
   ```bash
   # View entities via API:
   curl http://localhost:3000/api/entities
   ```

2. **Check chat monitor:**
   ```bash
   npm run debug
   # Look for "[ChatMonitor] Chat: <player> message" logs
   ```

3. **Run integration test:**
   ```bash
   npm run test:integration
   # Check "Full Flow" test
   ```

**Solutions:**

✓ **Verify entity is enabled:**
```javascript
// Entity configuration should have:
{
  enabled: true,
  llm: {
    enabled: true
  }
}
```

✓ **Check proximity settings:**
```javascript
// If proximity is required, ensure:
{
  knowledge: {
    proximityRequired: false // Or set position correctly
  }
}
```

✓ **Verify name mention:**
```javascript
// If NPC requires name mention, use it in chat:
"Hey EntityName, what's up?"
```

✓ **Check chat log monitoring:**
```bash
# Verify MC_LOG_PATH in .env points to correct file:
MC_LOG_PATH=/path/to/minecraft/logs/latest.log

# Check file exists and is readable:
ls -l /path/to/minecraft/logs/latest.log
tail -f /path/to/minecraft/logs/latest.log
```

✓ **Check permissions:**
```javascript
// Entity must have:
{
  permissions: {
    canExecuteCommands: true,
    whitelistedCommands: ['say', 'tellraw'] // At minimum
  }
}
```

### Problem: NPC Responds but Messages Don't Appear in Game

**Symptoms:**
- Logs show NPC generated response
- No chat messages appear in Minecraft

**Solutions:**

✓ **Check RCON connection:**
```bash
npm run test:health
# RCON must be connected
```

✓ **Verify tellraw command:**
```javascript
// Response should use tellraw format:
tellraw @a {"text":"[AI] <EntityName> Hello!","color":"aqua"}
```

✓ **Check command execution:**
```bash
npm run debug
# Look for "[RCON] Executing: tellraw..." logs
```

---

## Command Validation Issues

### Problem: Commands Are Being Blocked

**Symptoms:**
- "Command validation failed" errors
- "Command not in entity's whitelist"
- Valid commands rejected

**Diagnostic Steps:**

1. **Test command validation:**
   ```bash
   # Using API:
   curl -X POST http://localhost:3000/api/commands/validate \
     -H "Content-Type: application/json" \
     -d '{"command":"/time set day","entityId":"entity-id"}'
   ```

2. **Check entity permissions:**
   ```javascript
   // Get entity details:
   curl http://localhost:3000/api/entities
   ```

**Solutions:**

✓ **Update entity whitelist:**
```javascript
// Allow all safe commands:
{
  permissions: {
    whitelistedCommands: ['*'],
    blacklistedCommands: ['ban', 'op', 'deop', 'stop', 'whitelist']
  }
}
```

✓ **Update minecraft-commands.csv:**
```bash
# Ensure command is marked as whitelisted:
time,world,environment,true,Set or query world time
```

✓ **Check permission level:**
```javascript
// Ensure entity level is sufficient:
{
  permissions: {
    level: 'environment', // readonly < environment < user < mod < admin
    whitelistedCommands: ['*']
  }
}
```

✓ **Reload command database:**
```bash
# Restart server to reload minecraft-commands.csv:
npm run server
```

### Problem: Command Syntax Errors

**Symptoms:**
- "Unknown command" in Minecraft
- Command executes but with wrong syntax

**Solutions:**

✓ **Check command format:**
```javascript
// LLM should output commands without leading slash:
[COMMAND: /time set day]

// Or with slash (parser handles both):
/time set day
```

✓ **Validate with Minecraft:**
```bash
# Test command directly in Minecraft console:
/time set day
# If it fails there, syntax is wrong
```

✓ **Check command arguments:**
```javascript
// Common errors:
/time set day   // ✓ Correct
/time day       // ✗ Wrong
/weather clear  // ✓ Correct
/weather sunny  // ✗ Wrong (no "sunny" option)
```

---

## Performance Issues

### Problem: High CPU Usage

**Symptoms:**
- System sluggish
- Server slow to respond
- High CPU in task manager

**Solutions:**

✓ **Reduce LLM model size:**
```bash
# Use smaller model:
ollama pull llama2:7b
OLLAMA_MODEL=llama2:7b
```

✓ **Limit concurrent requests:**
```javascript
// In conversation queue, ensure sequential processing
// (already implemented in conversationQueue.processNext)
```

✓ **Reduce polling frequency:**
```bash
# In .env:
CHAT_POLL_INTERVAL=2000  # Increase from 1000ms
```

### Problem: High Memory Usage

**Solutions:**

✓ **Limit log history:**
```javascript
// In mcp-server.js:
this.maxLogs = 500; // Reduce from 1000
```

✓ **Clear conversation history:**
```javascript
// Reduce context window:
conversationQueue.buildFullContext(entity, 5); // Reduce from 20
```

✓ **Restart periodically:**
```bash
# Use a process manager like PM2:
pm2 start npm --name "craftbot" -- run server
pm2 restart craftbot --cron "0 3 * * *" # Restart daily at 3 AM
```

---

## Common Error Messages

### "ECONNREFUSED" Error

**Cause:** Service not running or wrong port

**Fix:**
```bash
# For RCON:
- Check Minecraft server is running
- Verify RCON port in .env matches server.properties

# For Ollama:
ollama serve

# For MCP Server:
npm run server
```

### "ETIMEDOUT" Error

**Cause:** Request timeout

**Fix:**
```bash
# Increase timeout in relevant client:
# - rcon-client.js
# - ollama-client.js

# Or check network connectivity
```

### "Cannot find module" Error

**Cause:** Missing dependencies

**Fix:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### "Port already in use" Error

**Cause:** Port conflict

**Fix:**
```bash
# Kill process on port:
lsof -ti :3000 | xargs kill -9

# Or change port in .env:
SERVER_PORT=3001
```

### "Permission denied" Error

**Cause:** File permissions or command restrictions

**Fix:**
```bash
# For scripts:
chmod +x scripts/*.sh

# For entity permissions:
# Update entity configuration with proper permission level
```

---

## Advanced Debugging

### Enable Detailed Logging

```javascript
// Add to server files for more verbose logging:
console.debug('[Module] Detailed info:', data);
```

### Monitor Network Traffic

```bash
# Using tcpdump:
sudo tcpdump -i lo0 -A port 3000

# Or use Wireshark for GUI
```

### Profile Performance

```javascript
// Add performance marks:
console.time('operation');
// ... code ...
console.timeEnd('operation');
```

### Check Environment

```bash
# Verify all environment variables:
env | grep -E "RCON|OLLAMA|SERVER|MC_"

# Check node environment:
node -p "process.versions"
node -p "process.platform"
```

---

## Getting Help

If you've tried all troubleshooting steps and still have issues:

1. **Collect diagnostic information:**
   ```bash
   npm run preflight > diagnostic.txt
   npm run test:health >> diagnostic.txt
   npm run test:integration >> diagnostic.txt
   ```

2. **Check logs:**
   ```bash
   npm run debug > logs.txt
   # Let it run for a minute, then Ctrl+C
   ```

3. **Document your issue:**
   - What you were trying to do
   - What you expected to happen
   - What actually happened
   - Steps to reproduce
   - Your environment (OS, Node version, etc.)

4. **Check documentation:**
   - README.md - Setup and overview
   - SERVER_ARCHITECTURE.md - System design
   - SETUP_GUIDE.md - Detailed setup instructions

---

## Preventive Maintenance

### Daily Checks

```bash
# Quick health check:
npm run test:health
```

### Weekly Maintenance

```bash
# Update dependencies:
npm update

# Clean caches:
npm cache clean --force
rm -rf node_modules/.vite

# Restart services:
npm run dev:full
```

### Before Major Updates

```bash
# Full diagnostic:
npm run preflight
npm run test:integration

# Backup configuration:
cp .env .env.backup
cp -r data/ data.backup/
```

---

## Quick Reference

| Issue | Quick Fix |
|-------|-----------|
| Frontend won't load | `npm install && npm run dev` |
| Backend not responding | `npm run server` |
| RCON failed | Check Minecraft server & RCON settings |
| Ollama unavailable | `ollama serve` |
| High CPU | Switch to smaller model |
| Port conflict | Kill process or change port |
| WebSocket drops | Check network stability |
| Commands blocked | Update entity permissions |
| NPC not responding | Check entity enabled & LLM config |
| Tests failing | `npm run preflight` |

---

## Summary Flowchart

```
Issue?
│
├─ Frontend not loading?
│  └─ Run: npm run preflight
│     ├─ Dependencies missing? → npm install
│     ├─ Port conflict? → Change port or kill process
│     └─ Cache issue? → Clear cache & restart
│
├─ Backend not responding?
│  └─ Run: npm run test:health
│     ├─ Server not running? → npm run server
│     ├─ Port conflict? → Check lsof -i :3000
│     └─ Dependencies? → npm install
│
├─ RCON not working?
│  └─ Check Minecraft server
│     ├─ Server running? → Start Minecraft
│     ├─ RCON enabled? → Edit server.properties
│     ├─ Credentials? → Update .env
│     └─ Port open? → Check firewall
│
├─ Ollama not working?
│  └─ Run: curl localhost:11434/api/tags
│     ├─ Not running? → ollama serve
│     ├─ Model missing? → ollama pull model-name
│     └─ Slow? → Use smaller model
│
├─ NPC not responding?
│  └─ Check entity config
│     ├─ Enabled? → Set enabled: true
│     ├─ LLM enabled? → Set llm.enabled: true
│     ├─ Permissions? → Add to whitelist
│     ├─ Log monitoring? → Check MC_LOG_PATH
│     └─ Proximity? → Disable or set position
│
└─ Commands blocked?
   └─ Check permissions
      ├─ Whitelist? → Add command or use '*'
      ├─ Permission level? → Increase level
      └─ CSV file? → Update minecraft-commands.csv
```

---

For more detailed information, see the main documentation files in the project root.
