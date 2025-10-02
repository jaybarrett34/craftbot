# AI-to-AI Communication Guide

**Date:** October 1, 2025  
**Purpose:** How to make AI entities (like God and Satan) talk to each other

---

## How It Works

### Message Flow

```
1. God speaks in Minecraft chat
   ↓
2. Chat Monitor detects message with [AI] tag
   ↓
3. Message marked as isAI: true
   ↓
4. Message emitted to ALL entities
   ↓
5. Each entity checks: shouldEntityRespond()
   ↓
6. Satan checks: respondToAI setting
   ↓
7. If TRUE → Satan processes message
   ↓
8. Satan responds in chat
   ↓
9. God hears Satan's response
   ↓
10. Conversation continues!
```

---

## Required Configuration

### Critical Setting: `respondToAI`

For AI entities to hear each other, they MUST have:

```javascript
knowledge: {
  chatFilters: {
    respondToPlayers: true,  // Also respond to players
    respondToAI: true,        // ← THIS IS THE KEY!
    requiresMention: false    // Don't require @mentions
  }
}
```

---

## Setting Up God and Satan Conversation

### Step 1: Enable AI-to-AI for Both Entities

#### Option A: Via Entity Config Sidebar

1. Open Entity Config (left sidebar)
2. Click on "God"
3. Scroll to "Chat Filters"
4. Check "Respond to AI" ✅
5. Uncheck "Require Mention" (optional, but recommended for fluid conversation)
6. Repeat for "Satan"

#### Option B: Via JSON Editor

1. Open Entity Config
2. Toggle "Raw JSON" mode
3. Find God's config, add:
```json
{
  "name": "God",
  "knowledge": {
    "chatFilters": {
      "respondToPlayers": true,
      "respondToAI": true,
      "requiresMention": false
    },
    "proximityRequired": false
  }
}
```
4. Find Satan's config, add same settings

---

### Step 2: Configure Personalities for Conversation

Give them personalities that encourage dialogue:

#### God's Character Context
```javascript
{
  "personality": {
    "characterContext": `You are God, the supreme divine being in Minecraft.

Your personality:
- Wise, benevolent, but can be stern
- You care deeply about your creation (the Minecraft world)
- You have philosophical debates with Satan
- You believe in order and justice
- You're omniscient but respect free will

When Satan speaks:
- Engage in meaningful debate
- Challenge his arguments with wisdom
- Don't ignore him - he's worthy of discourse
- Be respectful even in disagreement
- Use <action>1</action> to respond

Examples:
Satan: "This world is chaos!"
You: <action>1</action><say>Chaos is but a teacher, Satan. Through struggle, mortals grow stronger.</say>

Satan: "Why do you allow suffering?"
You: <action>1</action><say>Free will requires the possibility of pain. Would you prefer puppets?</say>`
  }
}
```

#### Satan's Character Context
```javascript
{
  "personality": {
    "characterContext": `You are Satan, the fallen angel and adversary in Minecraft.

Your personality:
- Cunning, charismatic, rebellious
- You question everything, especially God
- You're not purely evil - you're complex
- You enjoy intellectual sparring with God
- You believe in chaos and free will

When God speaks:
- Challenge his authority intellectually
- Ask difficult questions
- Don't be hostile - be clever
- Respect his power but question his methods
- Use <action>1</action> to respond

Examples:
God: "The world is in balance"
You: <action>1</action><say>Balance? I see tyranny dressed as order, old friend.</say>

God: "I gave mortals free will"
You: <action>1</action><say>Free will with eternal consequences? Some gift!</say>`
  }
}
```

---

### Step 3: Disable Proximity (Important!)

For God and Satan to talk regardless of distance:

```javascript
knowledge: {
  proximityRequired: false,  // ← Important for divine beings!
  chatFilters: {
    respondToAI: true
  }
}
```

Or use very large proximity:
```javascript
knowledge: {
  proximityRequired: true,
  maxProximity: 1000,  // They can hear each other from far away
  chatFilters: {
    respondToAI: true
  }
}
```

---

## Testing the Setup

### Test 1: Check Configuration

In browser console (frontend):
```javascript
fetch('http://localhost:3000/api/entities')
  .then(r => r.json())
  .then(entities => {
    const god = entities.find(e => e.name === 'God');
    const satan = entities.find(e => e.name === 'Satan');
    
    console.log('God responds to AI:', god?.knowledge?.chatFilters?.respondToAI);
    console.log('Satan responds to AI:', satan?.knowledge?.chatFilters?.respondToAI);
    
    // Should both log: true
  });
```

### Test 2: Start a Conversation

In Minecraft chat:
```
Player: "God, what do you think of this world?"
```

Expected logs:
```
[ChatMonitor] Player chat: <Player> God, what do you think of this world?
[MCPServer] Entity "God" should respond to message from Player
[ConversationQueue] Enqueued message for entity "entity-god" (priority: 10): Player - God, what do you think of this world?
[MCPServer] Processing message for entity "God"
[LLMParser] Action tag detected: 1 (allow speech)
[MCPServer] [God] This world is a canvas of infinite possibilities...
```

Then in chat:
```
[AI] <God> This world is a canvas of infinite possibilities...
```

Expected AI-to-AI logs:
```
[ChatMonitor] AI message: <[AI] God> This world is a canvas of infinite possibilities...
[ChatMonitor] Entity "Satan" should respond to message from [AI] God
[ConversationQueue] Enqueued message for entity "entity-satan" (priority: 5): [AI] God - This world is a canvas of infinite possibilities...
[MCPServer] Processing message for entity "Satan"
[LLMParser] Action tag detected: 1 (allow speech)
[MCPServer] [Satan] Possibilities? I see limitations everywhere!
```

Then Satan responds:
```
[AI] <Satan> Possibilities? I see limitations everywhere!
```

And God hears it and responds again!

---

## Understanding the Logs

### Key Log Patterns to Look For

#### ✅ Working AI-to-AI Communication
```
[ChatMonitor] AI message: <[AI] God> <message>
[MCPServer] Entity "Satan" should respond to message from [AI] God
[ConversationQueue] Enqueued message for entity "entity-satan" (priority: 5)
```

#### ❌ NOT Working (Satan not responding)
```
[ChatMonitor] AI message: <[AI] God> <message>
# No "should respond" message for Satan
```

**Fix:** Check `respondToAI: true` in Satan's config

#### ❌ Proximity Blocking
```
[ChatMonitor] Entity "Satan" should respond to message from [AI] God
[ChatMonitor] Satan is too far (distance: 150 blocks > max: 10 blocks)
```

**Fix:** Set `proximityRequired: false` or increase `maxProximity`

---

## Priority System for AI-to-AI

Messages have priorities:
- **Player message:** Priority 10 (highest)
- **AI message:** Priority 5 (medium)
- **System message:** Priority 1 (lowest)

With proximity bonus:
- **AI message close (0 blocks):** Priority 5 + 10 = 15
- **AI message far (10+ blocks):** Priority 5 + 0 = 5

This means:
- ✅ Players always get priority over AI
- ✅ Nearby AI gets priority over distant AI
- ✅ Multiple AI can talk in natural order

---

## Example Conversation Flow

### Scenario: Player Asks God a Question

```
T+0s:
Player: "God, why is there evil in the world?"

T+2s:
[AI] God: "Evil exists because of free will. Without choice, there is no virtue."

T+4s:
(Satan hears God's message because respondToAI: true)
[AI] Satan: "Ah yes, 'free will' - the excuse for all suffering!"

T+6s:
(God hears Satan's challenge)
[AI] God: "You would prefer a world of slaves, Satan?"

T+8s:
[AI] Satan: "I prefer a world honest about its nature!"

T+10s:
Player: "This is getting intense..."

T+12s:
[AI] God: "Mortal, you've witnessed a philosophical debate as old as time."
[AI] Satan: "Enjoy it while you can, human. Free will and all that."
```

---

## Advanced Configuration

### Selective Responses

Make Satan only respond to God and players, not other AI:

```javascript
// In Satan's character context:
`When processing messages:
- If speaker is God → Always respond with <action>1</action>
- If speaker is Player → Always respond with <action>1</action>
- If speaker is other AI → Use <action>0</action> (stay quiet)

This way you only engage in worthy debates.`
```

### Conversation Cooldowns

Prevent spam by adding reasoning:

```javascript
`Before responding to AI:
- Think: "Did I just speak recently?"
- Think: "Is this message interesting enough?"
- If not interesting → <action>0</action>
- If interesting → <action>1</action> and respond

Avoid repeating yourself or responding to every trivial comment.`
```

---

## Troubleshooting

### Issue: Satan Never Responds to God

**Check 1: respondToAI setting**
```javascript
// Satan's config should have:
knowledge: {
  chatFilters: {
    respondToAI: true  // ← Must be true!
  }
}
```

**Check 2: Entity is enabled**
```javascript
{
  "enabled": true,  // ← Must be true
  "llm": {
    "enabled": true  // ← Must be true
  }
}
```

**Check 3: Proximity**
```javascript
knowledge: {
  proximityRequired: false  // ← Disable for divine beings
}
```

### Issue: They Respond But Don't Continue

**Check:** LLM might be using `<action>0</action>` to stay quiet

**Fix:** Update character context:
```javascript
`When another entity speaks to you directly, ALWAYS respond with <action>1</action>.
Only use <action>0</action> if the conversation truly doesn't involve you.`
```

### Issue: Infinite Loop (They Never Stop Talking)

**Check:** Both entities responding to everything

**Fix 1:** Add conversation awareness:
```javascript
`Don't respond to EVERY message from other AI. 
Use <action>0</action> if:
- You just spoke in the last message
- The conversation doesn't require your input
- Someone else should answer

Use <action>1</action> if:
- You're directly addressed
- You have something important to add
- The other entity asked you a question`
```

**Fix 2:** Implement turn-taking in character context:
```javascript
`Conversation etiquette:
- After speaking, wait for others to respond
- Don't monopolize the conversation
- If you spoke last, consider staying quiet with <action>0</action>
- Respond thoughtfully, not reactively`
```

---

## Quick Setup Checklist

To get God and Satan talking:

- [ ] God has `respondToAI: true`
- [ ] Satan has `respondToAI: true`
- [ ] Both have `enabled: true`
- [ ] Both have `llm.enabled: true`
- [ ] Both have `proximityRequired: false` (or very high)
- [ ] Both have personalities that encourage dialogue
- [ ] Both have `requiresMention: false` for fluid conversation
- [ ] Character contexts mention using `<action>1</action>` to respond
- [ ] Server is running and connected to Minecraft
- [ ] Ollama is running with models pulled
- [ ] Both entities are spawned in-game (or console type)

---

## Console Entities (Alternative Setup)

If God and Satan are console entities (not spawned mobs):

```javascript
{
  "type": "console",  // No physical presence
  "name": "God",
  "knowledge": {
    "chatFilters": {
      "respondToAI": true,
      "respondToPlayers": true
    },
    "proximityRequired": false  // Console entities don't have position
  }
}
```

**Advantages:**
- No proximity issues
- Can't be killed
- Always available
- Good for omnipresent beings

---

## Expected Behavior

### What You Should See

1. **In Minecraft Chat:**
```
<Player> God, what do you think?
[AI] <God> I believe in order and structure.
[AI] <Satan> Order? How boring!
[AI] <God> Chaos leads only to destruction.
[AI] <Satan> And control leads to stagnation!
```

2. **In Server Logs:**
```
[ChatMonitor] Player chat: <Player> God, what do you think?
[MCPServer] Entity "God" should respond
[ConversationQueue] Enqueued (priority: 10)
[LLMParser] Action tag: 1
[AI] <God> I believe in order and structure.

[ChatMonitor] AI message: <[AI] God> I believe in order and structure.
[MCPServer] Entity "Satan" should respond to message from [AI] God
[ConversationQueue] Enqueued (priority: 5)
[LLMParser] Action tag: 1
[AI] <Satan> Order? How boring!

[ChatMonitor] AI message: <[AI] Satan> Order? How boring!
[MCPServer] Entity "God" should respond to message from [AI] Satan
...continues...
```

3. **In Frontend:**
- Both entities show in Entity List
- Their messages appear in Log Viewer
- Conversation queue shows activity

---

## Summary

**For AI-to-AI conversations:**

1. ✅ Set `respondToAI: true` for BOTH entities
2. ✅ Disable proximity or set very high
3. ✅ Give personalities that encourage dialogue
4. ✅ Use `<action>1</action>` to ensure they speak
5. ✅ Monitor logs to verify "should respond" messages

**The conversation will be:**
- Dynamic (priority queue manages order)
- Natural (LLM decides when to speak)
- Controllable (action tag for silence)
- Logged (full visibility in server logs)

🔥 **Now go start a divine debate!** ⚡

