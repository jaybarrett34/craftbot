# God & Satan Communication Debug Guide

**Issue:** They're not talking to each other despite having `respondToAI: true`

---

## What to Check in Logs

### 1. Is the AI message being detected?

Look for:
```
[ChatMonitor] AI message: <[AI] God> <some message>
```

**If you see this:** ✅ Chat monitor is detecting AI messages

**If you DON'T see this:** ❌ The message isn't being tagged as AI
- Check if the message in chat actually has `[AI]` tag
- Example: `[AI] <God> Hello` (should be detected)
- Example: `<God> Hello` (won't be detected as AI)

### 2. Is Satan being checked for response?

Look for:
```
[MCPServer] Entity "Satan" should respond to message from [AI] God
```

**If you see this:** ✅ Satan is being considered for response

**If you DON'T see this:** ❌ Satan failed the `shouldEntityRespond` check
- Check: Is Satan enabled? (`entity.enabled: true`)
- Check: Is Satan's LLM enabled? (`entity.llm.enabled: true`)
- Check: Does Satan have `respondToAI: true`?

### 3. Is the message being queued?

Look for:
```
[ConversationQueue] Enqueued message for entity "entity-satan" (priority: 5): [AI] God - Hello
```

**If you see this:** ✅ Message was queued for Satan

**If you DON'T see this:** ❌ Message wasn't queued
- Satan failed proximity check
- Satan failed some other filter

### 4. Is Satan processing the message?

Look for:
```
[MCPServer] Processing message for entity "Satan"
[LLMParser] Action tag detected: X
```

**If you see action: 0:** Satan CHOSE not to speak
- This is the LLM deciding to stay quiet
- Check Satan's character context
- Make sure it encourages responding to God

**If you see action: 1:** Satan WANTS to speak
- Check if message actually appears in chat
- Check for errors in sending

### 5. Does Satan actually respond?

Look for:
```
[MCPServer] [Satan] <some response>
```

**If you see this:** ✅ Satan responded!

**If you DON'T see this:** Satan processed but didn't generate response
- Check LLM errors
- Check if model is available
- Check Ollama logs

---

## Manual Test Commands

### Test 1: Direct API Call

```bash
# Trigger God manually
curl -X POST http://localhost:3000/api/test-entity-response \
  -H "Content-Type: application/json" \
  -d '{
    "entityId": "YOUR_GOD_ENTITY_ID",
    "message": "Hello Satan, can you hear me?"
  }'
```

(Note: You'll need to add this endpoint for testing, or just send a chat message in-game)

### Test 2: In Minecraft

1. Type in chat: `/say [AI] <God> Hello Satan`
2. Check server logs immediately
3. Look for the 5 log patterns above

### Test 3: Force God to Speak

In Minecraft:
```
/tellraw @a {"text":"[AI] <God> Hello Satan, this is a test!","color":"gold"}
```

This simulates God speaking. Check if Satan responds.

---

## Common Issues

### Issue: LLM Using `<action>0</action>`

**Symptom:** Logs show entity processing but no output

**Cause:** The LLM is deciding not to speak

**Fix:** Update character context to encourage responses:

```javascript
{
  "personality": {
    "characterContext": `You are Satan. When God speaks to you:
    
CRITICAL RULES:
- ALWAYS use <action>1</action> when God addresses you
- NEVER use <action>0</action> when in conversation with God
- Your debates with God are legendary - engage fully!
- Challenge his statements with clever counterarguments

Example response format:
<thinking>God just said something interesting about free will</thinking>
<action>1</action>
<say>Ah, free will again? That old excuse...</say>
    
Be provocative, intelligent, and ALWAYS respond to God.`
  }
}
```

### Issue: Model Not Available

**Symptom:** Errors about model not found

**Fix:**
```bash
# Check what models are available
ollama list

# Pull the model both entities are configured for
ollama pull qwen2.5:14b-instruct
```

### Issue: Timing/Race Condition

**Symptom:** Sometimes works, sometimes doesn't

**Possible causes:**
- Queue processing overlapping
- LLM response slow
- Multiple messages at once

**Debug:**
```
# Look for queue status
[ConversationQueue] X message(s) still in queue for "Satan", continuing processing...
```

---

## Expected Full Log Sequence

For a working God → Satan conversation, you should see:

```
1. [ChatMonitor] AI message: <[AI] God> Hello Satan
2. [MCPServer] Entity "Satan" should respond to message from [AI] God
3. [ConversationQueue] Enqueued message for entity "entity-satan-123" (priority: 5): [AI] God - Hello Satan
4. [MCPServer] Processing message for entity "Satan"
5. [OllamaClient] Sending chat request to qwen2.5:14b-instruct...
6. [LLMParser] Action tag detected: 1 (allow speech)
7. [MCPServer] [Satan] Hello God, good to hear from you
8. --- Satan's message becomes new AI message ---
9. [ChatMonitor] AI message: <[AI] Satan> Hello God, good to hear from you
10. [MCPServer] Entity "God" should respond to message from [AI] Satan
11. (repeat for God)
```

---

## Quick Fix Checklist

For God and Satan to talk:

- [ ] Both have `enabled: true`
- [ ] Both have `llm.enabled: true`
- [ ] Both have `knowledge.chatFilters.respondToAI: true`
- [ ] Both have `proximityRequired: false` (or very high)
- [ ] Both have models pulled (`ollama list`)
- [ ] Both have character contexts that encourage debate
- [ ] Both have `<action>1</action>` encouraged in prompts
- [ ] Server is running and connected
- [ ] Ollama is running

---

## Test with Browser Console

```javascript
// Send a test message
fetch('http://localhost:3000/api/queue-stats')
  .then(r => r.json())
  .then(stats => {
    console.log('Queue Stats:', stats);
    // Should show: entities, totalQueued, totalHistory, processing
  });

// Check if messages are in queue
fetch('http://localhost:3000/api/entities')
  .then(r => r.json())
  .then(entities => {
    entities.forEach(e => {
      if (e.name === 'God' || e.name === 'Satan') {
        console.log(`${e.name}:`, {
          enabled: e.enabled,
          llmEnabled: e.llm?.enabled,
          respondToAI: e.knowledge?.chatFilters?.respondToAI,
          model: e.llm?.model
        });
      }
    });
  });
```

---

## Still Not Working?

1. **Restart the server** - Clear any stuck state
2. **Check Ollama** - `ollama ps` to see if models are loaded
3. **Simplify** - Disable all filters temporarily
4. **Test with Player** - Make sure God responds to YOU first
5. **Check Model** - Try a simpler model like `mistral` or `phi`

Then check logs again with the 5 patterns above!

