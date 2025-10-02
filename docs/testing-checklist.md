# Craftbot MCP Testing Checklist

This comprehensive checklist covers all aspects of the Craftbot MCP system. Test in order for best results.

## Pre-Testing Setup

- [ ] All services are running (Minecraft, Ollama, MCP Backend, Frontend)
- [ ] At least one AI entity is configured and enabled
- [ ] Test player account can join the Minecraft server
- [ ] Browser dev tools are open to monitor console logs

---

## 1. Infrastructure Tests

### RCON Connection Tests

- [ ] **RCON connection establishes successfully**
  - Check backend logs for "RCON connected" message
  - No connection errors in backend logs

- [ ] **Can send basic commands via RCON**
  - Test command: `/list`
  - Verify response contains player list
  - Backend logs show command sent and response received

- [ ] **RCON reconnection works after server restart**
  - Restart Minecraft server
  - Verify backend automatically reconnects
  - Check `autoReconnect` config setting

- [ ] **RCON authentication handles wrong password**
  - Temporarily change RCON password in config
  - Verify authentication error is logged properly
  - System doesn't crash on auth failure

### Log Monitoring Tests

- [ ] **Chat messages are detected in logs**
  - Send chat message in Minecraft: `Hello world`
  - Verify message appears in backend logs
  - Check frontend Log Viewer shows the message

- [ ] **Different log levels are parsed correctly**
  - Verify INFO messages are captured
  - Verify WARN messages are captured
  - Verify ERROR messages are captured
  - Each level displays with correct styling

- [ ] **Log file polling works continuously**
  - Send multiple messages over time
  - All messages appear in frontend
  - No messages are skipped or duplicated

- [ ] **Log rotation is handled**
  - Trigger Minecraft log rotation (restart server)
  - Verify system continues reading new log file
  - No crashes or stuck states

---

## 2. Entity Detection Tests

### NPC Recognition

- [ ] **NPCs with `[AI]` tag are identified**
  - Spawn NPC with name containing `[AI]`
  - Example: `/summon minecraft:villager ~ ~ ~ {CustomName:'["",{"text":"[AI] Bob"}]'}`
  - Verify entity appears in entity list
  - Backend logs show entity detected

- [ ] **NPCs without `[AI]` tag are ignored**
  - Spawn regular NPC without `[AI]` tag
  - Verify it does NOT appear in AI entity list
  - System doesn't attempt to respond to their messages

- [ ] **Console entity is always available**
  - Verify "Server Console" entity exists in config
  - Console entity has `type: "console"`
  - Console permissions are set to "admin"

- [ ] **Multiple AI entities can coexist**
  - Configure 2+ AI entities
  - Both appear in entity list
  - Each can respond independently

---

## 3. Message Processing Tests

### Conversation Queue

- [ ] **Messages are added to conversation queue**
  - Player sends message to AI entity
  - Backend logs show message queued
  - Queue processes message in order

- [ ] **Queue processes messages sequentially**
  - Send 3 rapid messages
  - Verify all 3 are processed
  - Responses come in order sent

- [ ] **Queue handles empty state gracefully**
  - Wait for queue to empty
  - Verify no errors when idle
  - New messages still processed

- [ ] **Message deduplication works**
  - Same message appears twice in logs (e.g., from server echo)
  - Verify only processed once
  - No duplicate responses

### Addressing and Mentions

- [ ] **Direct mentions work**
  - Message: `@[AI] Bob hello`
  - Verify Bob responds
  - Other entities don't respond

- [ ] **Proximity detection triggers**
  - Stand near AI entity (within perception radius)
  - Say hello without mentioning name
  - Entity responds based on proximity

- [ ] **Global messages to console work**
  - Any message in chat (not addressed)
  - Console entity can see it (if configured)
  - Console responds appropriately

---

## 4. LLM Integration Tests

### Ollama Connection

- [ ] **Ollama responds with valid responses**
  - Trigger AI entity response
  - Verify Ollama API call succeeds
  - Response is valid text (not error JSON)

- [ ] **Ollama timeout handling**
  - Temporarily stop Ollama service
  - Send message to AI entity
  - Verify timeout error is logged
  - System doesn't hang

- [ ] **Model switching works**
  - Configure entity with different model (e.g., llama3.2)
  - Verify correct model is called
  - Response still generated

- [ ] **Temperature setting affects responses**
  - Set temperature to 0.1 (deterministic)
  - Set temperature to 0.9 (creative)
  - Observe response variation

### XML Response Parsing

- [ ] **Valid XML is parsed correctly**
  - Response contains `<speech>`, `<command>`, `<silence>`
  - All tags are extracted
  - Content is properly decoded

- [ ] **Malformed XML is handled**
  - Simulate malformed XML response
  - System logs warning
  - Fallback behavior activates

- [ ] **Multiple commands in one response**
  - Response contains multiple `<command>` tags
  - All commands are extracted
  - Each command is validated individually

- [ ] **Empty tags are handled**
  - Response contains `<speech></speech>`
  - No error occurs
  - Entity doesn't say anything

---

## 5. Command Validation Tests

### Permission Checks

- [ ] **Admin commands work with admin permissions**
  - Entity: `accessLevel: "admin"`
  - Command: `/op TestPlayer`
  - Command executes successfully

- [ ] **Restricted commands blocked for lower permissions**
  - Entity: `accessLevel: "readonly"`
  - Command: `/ban TestPlayer`
  - Command is BLOCKED
  - Warning logged

- [ ] **Whitelist allows specific commands**
  - Entity: `allowedCommands: ["say", "tell"]`
  - Command: `/say Hello`
  - Command allowed ✓
  - Command: `/give @s diamond 64`
  - Command blocked ✗

- [ ] **Blacklist denies specific commands**
  - Entity: `deniedCommands: ["stop", "ban"]`
  - Command: `/stop`
  - Command is BLOCKED
  - Other commands still work

- [ ] **Wildcard permissions work**
  - Entity: `allowedCommands: ["*"]`
  - Any command executes (with access level check)

### Command Execution

- [ ] **Whitelisted commands execute**
  - Entity allowed to execute `/give`
  - Command: `/give @s diamond 1`
  - Player receives diamond
  - Success message logged

- [ ] **Dangerous commands require confirmation**
  - Command: `/stop`
  - Confirmation prompt shown (if configured)
  - Command only executes after confirmation

- [ ] **Command syntax validation**
  - Invalid command: `/giev @s diamond`
  - Minecraft returns error
  - Error is logged and handled

- [ ] **Command rate limiting**
  - Send 10 commands rapidly
  - Verify rate limiting is applied (if configured)
  - Commands queue instead of being dropped

---

## 6. State Query Tests

### Player Information

- [ ] **Player state queries work**
  - Query: Get info about player "Steve"
  - Returns: Position, health, gamemode, inventory
  - Data is current and accurate

- [ ] **Offline player handling**
  - Query info about offline player
  - Returns appropriate "not online" message
  - No errors thrown

- [ ] **Player list is accurate**
  - Multiple players online
  - Query returns all players
  - Count matches `/list` command

### World Information

- [ ] **World state queries work**
  - Query: Time of day
  - Query: Weather
  - Query: Difficulty
  - All return correct values

- [ ] **Nearby entity detection**
  - Query: Entities within 10 blocks
  - Returns correct count and types
  - Ignores entities outside radius

### Proximity Detection

- [ ] **Proximity to players works**
  - AI entity has `perceptionRadius: 10`
  - Player within 10 blocks
  - Entity is aware of player

- [ ] **Proximity to NPCs works**
  - Two AI entities within perception radius
  - They can "see" each other
  - Can reference each other in responses

- [ ] **Unlimited perception works**
  - Entity: `perceptionRadius: -1`
  - Can see all entities everywhere
  - No distance restrictions

---

## 7. Response Behavior Tests

### Console Entity Responses

- [ ] **Console responds in server chat**
  - Console entity generates response
  - Uses `/say [Console] <message>`
  - All players see the message

- [ ] **Console can whisper to players**
  - Response includes `/tell Steve <message>`
  - Only Steve sees the message

### NPC Entity Responses

- [ ] **NPC responds with chat bubbles**
  - NPC entity generates response
  - Uses display entities for chat bubble (if configured)
  - OR uses `/tellraw` for NPC speech

- [ ] **NPC can execute commands**
  - NPC has command permissions
  - Response includes `<command>/tp @s ~ ~1 ~</command>`
  - Command executes as server console

### Silence Tag

- [ ] **`<silence>` prevents response**
  - LLM response contains `<silence>true</silence>`
  - No message sent to chat
  - Logged that entity chose silence

- [ ] **`<silence>` with reasoning**
  - Response: `<silence>Not my business</silence>`
  - Reason logged in backend
  - No chat message sent

---

## 8. Frontend Integration Tests

### Real-Time Log Viewer

- [ ] **Logs appear in real-time**
  - Send Minecraft chat message
  - Message appears in frontend within 2 seconds
  - No page refresh needed

- [ ] **Log scrolling works**
  - Generate 50+ log entries
  - Infinite scroll loads older logs
  - Smooth scrolling performance

- [ ] **Log filtering works**
  - Filter by level: INFO only
  - Filter by source: Chat only
  - Filter by search term: "Steve"
  - Results update immediately

- [ ] **Log export works**
  - Click export button
  - Downloads logs as JSON or TXT
  - All visible logs included

### Configuration UI

- [ ] **Entity list loads correctly**
  - All configured entities displayed
  - Entity details shown (name, type, enabled)

- [ ] **Entity editing works**
  - Click edit on entity
  - Modify settings (permissions, model, etc.)
  - Save changes
  - Backend receives update

- [ ] **Entity creation works**
  - Click "Add Entity"
  - Fill in details
  - Save new entity
  - Appears in list

- [ ] **Entity deletion works**
  - Click delete on entity
  - Confirmation dialog appears
  - Confirm deletion
  - Entity removed from backend

### WebSocket Connection

- [ ] **WebSocket connects on page load**
  - Frontend logs "WebSocket connected"
  - Connection status shows "Connected"

- [ ] **WebSocket reconnection works**
  - Restart backend server
  - Frontend detects disconnect
  - Automatically reconnects
  - Status indicator shows reconnection

- [ ] **WebSocket handles connection errors**
  - Stop backend entirely
  - Frontend shows "Disconnected" status
  - Retry indicator visible
  - Reconnects when backend returns

### Config Synchronization

- [ ] **Config changes sync to backend**
  - Change entity setting in UI
  - Backend immediately receives update
  - Other clients see change (if multiple frontends)

- [ ] **Backend changes appear in frontend**
  - Manually edit config file
  - Reload backend
  - Frontend updates without refresh

---

## 9. Edge Cases and Error Handling

### Malformed Input

- [ ] **Handles malformed chat messages**
  - Special characters in message
  - Unicode emoji
  - Very long messages (1000+ chars)
  - All processed without errors

- [ ] **Handles malformed LLM responses**
  - Missing XML tags
  - Unclosed tags
  - Invalid XML structure
  - System logs error and continues

### Resource Limits

- [ ] **Handles high message volume**
  - 10 players chatting simultaneously
  - Queue doesn't overflow
  - All messages processed eventually

- [ ] **Handles large log files**
  - Minecraft log > 100MB
  - System doesn't run out of memory
  - Only recent entries kept in memory

### Network Issues

- [ ] **Handles Ollama downtime**
  - Stop Ollama service
  - System logs error
  - Queued messages don't crash system

- [ ] **Handles RCON disconnects**
  - Disconnect RCON mid-operation
  - System attempts reconnection
  - Commands fail gracefully

- [ ] **Handles frontend disconnects**
  - Close browser tab
  - Backend continues operating
  - Reopen tab, everything still works

---

## 10. Security Tests

### Command Injection

- [ ] **SQL/Command injection attempts blocked**
  - Malicious input: `'; DROP TABLE users; --`
  - Input: `/stop && rm -rf /`
  - All sanitized properly
  - No unintended execution

### Permission Escalation

- [ ] **Entities cannot exceed permissions**
  - Readonly entity attempts `/op`
  - Command blocked
  - No privilege escalation

- [ ] **Config changes require authentication (if enabled)**
  - Attempt to modify config via API
  - Authentication required
  - Unauthorized requests rejected

### Data Leaks

- [ ] **Sensitive data not exposed**
  - RCON password not in logs
  - API keys not in responses
  - Frontend doesn't show secrets

---

## 11. Performance Tests

### Response Time

- [ ] **Chat messages processed within 2 seconds**
  - Time from message to queue
  - Acceptable latency

- [ ] **LLM responses within 10 seconds**
  - Time from queue to Ollama response
  - May vary by model

- [ ] **Command execution within 1 second**
  - Time from validation to RCON execution

### Resource Usage

- [ ] **Backend memory usage stable**
  - Monitor memory over 1 hour
  - No memory leaks
  - Usage stays within expected range

- [ ] **CPU usage reasonable**
  - Monitor CPU during high load
  - Spikes are brief
  - Returns to idle state

- [ ] **Frontend responsive**
  - UI remains smooth with 100+ logs
  - No lag when scrolling
  - Updates don't freeze page

---

## 12. Integration Tests

### Two-NPC Conversation

- [ ] **Two NPCs chat with each other**
  - NPC1: `[AI] Alice`
  - NPC2: `[AI] Bob`
  - Alice says hello
  - Bob responds
  - Conversation continues

### Player-NPC Dialogue

- [ ] **Player asks NPC for help**
  - Player: "Can you give me a diamond?"
  - NPC with item permissions responds
  - Executes `/give` command
  - Player receives item

### Complex Command Sequence

- [ ] **Multi-step command execution**
  - Player asks NPC to "teleport me up and give me wings"
  - NPC generates:
    - `<command>/tp @p ~ ~10 ~</command>`
    - `<command>/give @p elytra</command>`
  - Both commands execute in order
  - Player teleported and receives elytra

---

## Test Results Summary

**Date:** ___________
**Tester:** ___________
**Version:** ___________

**Total Tests:** ___
**Passed:** ___
**Failed:** ___
**Skipped:** ___

**Critical Issues Found:**
1. _______________________________
2. _______________________________

**Notes:**
________________________________
________________________________
________________________________

---

## Automated Testing (Future)

Consider implementing automated tests for:

- [ ] Unit tests for command validation
- [ ] Integration tests for RCON communication
- [ ] E2E tests for chat flow
- [ ] Load tests for high concurrency
- [ ] Security tests for injection attempts

**Recommended Testing Frameworks:**
- Backend: Jest, Mocha
- E2E: Playwright, Puppeteer
- Load: k6, Artillery
