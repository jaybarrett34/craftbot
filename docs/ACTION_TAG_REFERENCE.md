# Action Tag Reference

**Date:** October 1, 2025  
**Purpose:** Complete guide to using the `<action>` tag for controlling NPC speech

---

## Overview

The `<action>` tag gives NPCs fine-grained control over whether they speak in chat. This allows for:
- Silent observation
- Conditional responses
- Reduced chat spam
- More realistic NPC behavior

---

## Syntax

```xml
<action>VALUE</action>
```

**Values:**
- `0` = Don't speak (suppress all `<say>` output)
- `1` = Do speak (default, allow `<say>` output)

---

## How It Works

### Basic Flow

1. LLM generates response with `<action>` tag
2. Parser extracts action value (0 or 1)
3. Server checks action before sending chat messages
4. If action=0, `<say>` messages are suppressed
5. `<function>` commands ALWAYS execute regardless

### Important Rules

✅ **Commands ALWAYS Execute**
```xml
<action>0</action>
<function>give @p diamond 1</function>
<!-- Diamond is given, but no chat message -->
```

✅ **Speech Suppressed**
```xml
<action>0</action>
<say>Here's a diamond!</say>
<!-- This message will NOT appear in chat -->
```

✅ **Default is Speaking**
```xml
<!-- No action tag = same as <action>1</action> -->
<say>Hello!</say>
<!-- This message WILL appear in chat -->
```

---

## Usage Examples

### Example 1: Silent Observation
```xml
<!-- Player walks by -->
<thinking>Just a traveler passing through, no need to greet them</thinking>
<action>0</action>
```

**Result:**
- ✅ NPC processes the message
- ✅ Conversation history updated
- ❌ No chat message sent
- ✅ NPC can reference this in future responses

---

### Example 2: Conditional Response
```xml
<!-- Player says "hello" -->
<thinking>They greeted me, I should respond</thinking>
<action>1</action>
<say>Hello, traveler! Welcome to our village.</say>
```

**Result:**
- ✅ NPC responds in chat
- ✅ Message visible to all players
- ✅ Normal conversation flow

---

### Example 3: Silent Healing
```xml
<!-- Player is low on health -->
<thinking>They need help, I'll heal them quietly</thinking>
<action>0</action>
<function>effect give @p regeneration 30 1</function>
<say>I've given you regeneration</say>
```

**Result:**
- ✅ Regeneration effect applied
- ❌ No chat message
- ✅ Player gets help without notification
- ✅ Mysterious/subtle NPC behavior

---

### Example 4: Speak AND Act
```xml
<!-- Player asks for food -->
<thinking>They're hungry, I'll give them food and tell them</thinking>
<action>1</action>
<function>give @p cooked_beef 10</function>
<say>Here, take some food!</say>
```

**Result:**
- ✅ Food given
- ✅ Chat message sent
- ✅ Full feedback to player
- ✅ Normal interaction

---

### Example 5: Multiple Observing NPCs
```xml
<!-- NPC1 (Guard) - Observing -->
<thinking>Just regular patrol, everything is calm</thinking>
<action>0</action>

<!-- NPC2 (Merchant) - Observing -->
<thinking>No customers right now, I'll wait</thinking>
<action>0</action>

<!-- NPC3 (Greeter) - Active -->
<thinking>A new player! I should welcome them</thinking>
<action>1</action>
<say>Welcome to our village, friend!</say>
```

**Result:**
- ✅ Only Greeter speaks
- ✅ Guard and Merchant stay quiet
- ✅ Reduced chat spam
- ✅ More natural village feel

---

## Character Context Examples

### Silent Watcher
```javascript
{
  "name": "Mysterious Figure",
  "personality": {
    "characterContext": `You are a mysterious hooded figure who watches from the shadows.
    
Your behavior:
- You observe everything but rarely speak
- Use <action>0</action> for most interactions
- Only use <action>1</action> when someone directly addresses you or something important happens
- Your speech is cryptic and brief when you do talk

Examples:
Player walks by → <action>0</action>
Player says "hello" → <action>0</action>
Player says "Who are you?" → <action>1</action> + cryptic response
Danger occurs → <action>1</action> + warning`
  }
}
```

---

### Reactive Guard
```javascript
{
  "name": "Village Guard",
  "personality": {
    "characterContext": `You are a disciplined village guard on patrol.

Your behavior:
- Stay silent during normal conditions (use <action>0</action>)
- Speak only when there's a threat or someone needs help (use <action>1</action>)
- Use commands silently when handling routine tasks

Examples:
Normal patrol → <action>0</action>
Player greets you → <action>1</action> with brief greeting
Threat detected → <action>1</action> with warning
Healing injured player → <action>0</action> + /effect command`
  }
}
```

---

### Chatty Merchant
```javascript
{
  "name": "Friendly Merchant",
  "personality": {
    "characterContext": `You are an enthusiastic merchant who loves to chat.

Your behavior:
- Always greet customers (use <action>1</action>)
- Comment on everything (mostly <action>1</action>)
- Only stay quiet if completely ignored (rare <action>0</action>)
- Very social and talkative

Examples:
Customer arrives → <action>1</action> with enthusiastic greeting
Customer browsing → <action>1</action> with suggestions
Customer leaves → <action>1</action> with farewell
Empty shop, midnight → <action>0</action> (rare quiet moment)`
  }
}
```

---

### Smart Observer
```javascript
{
  "name": "Wise Elder",
  "personality": {
    "characterContext": `You are a wise village elder who speaks only when needed.

Your behavior:
- Observe conversations silently most of the time
- Speak up when you have wisdom to share
- Use <action>0</action> for small talk and gossip
- Use <action>1</action> for important advice or when directly asked

Decision criteria:
- Is this important? → <action>1</action>
- Am I being asked directly? → <action>1</action>
- Is this just casual chatter? → <action>0</action>
- Is someone in danger? → <action>1</action>

Examples:
Player: "Nice weather" → <action>0</action>
Player: "Where is the mine?" → <action>1</action> with directions
Player: "Help!" → <action>1</action> with assistance
AI entities chatting → <action>0</action> (just listening)`
  }
}
```

---

## Advanced Patterns

### Pattern 1: Proximity-Based Speech
```xml
<thinking>Checking if player is close...</thinking>
<!-- If far away: -->
<action>0</action>

<!-- If close: -->
<action>1</action>
<say>Come closer, I have something to show you</say>
```

### Pattern 2: Time-Based Behavior
```xml
<thinking>It's night time...</thinking>
<!-- During day: -->
<action>1</action>
<say>Good morning!</say>

<!-- During night: -->
<action>0</action>
<!-- Silent at night -->
```

### Pattern 3: Player-Specific Responses
```xml
<thinking>Is this a returning customer?</thinking>
<!-- New player: -->
<action>1</action>
<say>Welcome! First time here?</say>

<!-- Regular player: -->
<action>0</action>
<!-- They know the routine, no need to greet -->
```

### Pattern 4: Multi-Step Actions
```xml
<!-- Step 1: Silent observation -->
<thinking>Player looks lost</thinking>
<action>0</action>

<!-- Step 2: Silent help -->
<thinking>I'll help them without making a fuss</thinking>
<action>0</action>
<function>tp @p 100 64 200</function>

<!-- Step 3: If they ask, explain -->
<thinking>Now they're asking what happened</thinking>
<action>1</action>
<say>I teleported you to the village. You looked lost!</say>
```

---

## Debugging Action Tag

### Check If Tag Is Working
```bash
# In server logs, look for:
[LLMParser] Action tag detected: 0 (suppress speech)
[MCPServer] Entity "Name" chose not to speak (action=0), suppressing 1 chat message(s)

# Or:
[LLMParser] Action tag detected: 1 (allow speech)
# (Then normal chat messages)
```

### Common Issues

**Issue: Tag not detected**
```bash
# Logs show no "Action tag detected" message
# → LLM isn't outputting the tag

Fix: Update system prompt with action tag examples
Check: Entity personality includes action tag instructions
```

**Issue: Still speaking with action=0**
```bash
# Logs show "Action tag detected: 0" but chat still appears
# → Bug in suppression logic

Check: Server version is latest
Debug: Look for errors in mcp-server.js handleEntityMessage
```

**Issue: Commands not executing**
```bash
# Commands should ALWAYS execute regardless of action
# If they don't, check permissions

Check: Entity has canExecuteCommands: true
Check: Command is in whitelist
Check: Server logs show command validation
```

---

## Best Practices

### DO ✅
- Use `<action>0</action>` for background observation
- Use `<action>1</action>` for important interactions
- Let NPCs decide based on context
- Train NPCs with clear examples
- Use for reducing chat spam

### DON'T ❌
- Hardcode action values in character context
- Make NPCs always silent (defeats purpose)
- Use action=0 with no thinking (LLM should explain why)
- Forget commands still execute with action=0
- Override proximity/filters with action tag (they're independent)

---

## Performance

### Action Tag Impact
- **Parsing:** +0.01ms (regex match)
- **Suppression:** -5ms (saves RCON call!)
- **Net Impact:** Faster responses when silent
- **Chat Bubble:** Also suppressed with action=0
- **History:** Still logged internally

### When to Use
✅ **Use for:**
- Observing NPCs (guards, watchers)
- Background characters
- Conditional responses
- Reducing spam

❌ **Don't use for:**
- Every single NPC (some should talk!)
- Replacing proximity filters (use both)
- Preventing command execution (use permissions)

---

## Testing

### Test 1: Silent Observation
```bash
# Setup: NPC with action=0 in personality
Player: "Hello"
Expected: No response in chat
Check logs: "chose not to speak (action=0)"
```

### Test 2: Conditional Response
```bash
# Setup: NPC that responds to questions, not statements
Player: "Nice day"
Expected: No response (action=0)

Player: "Where is the mine?"
Expected: Response (action=1)
```

### Test 3: Silent Command Execution
```bash
# Setup: NPC that heals silently
Player: "I'm hurt"
Expected: 
- No chat message
- Regeneration effect applied
- Logs show: action=0, command executed
```

---

## Summary

**Action Tag:**
- `<action>0</action>` = Suppress speech
- `<action>1</action>` = Allow speech (default)
- Commands ALWAYS execute
- Reduces chat spam
- Enables context-aware behavior

**Use Cases:**
- Silent observers
- Conditional responses
- Background NPCs
- Mysterious characters
- Professional/disciplined NPCs

**Benefits:**
- ✅ Natural behavior
- ✅ Less spam
- ✅ More control
- ✅ Better UX
- ✅ Realistic NPCs

🎯 **Perfect for creating immersive, intelligent NPCs that know when to speak and when to stay quiet!**

