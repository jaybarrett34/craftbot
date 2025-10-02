# LLM Architecture for Minecraft AI NPCs

## Overview

This document describes the complete architecture for AI-powered NPCs in Minecraft using Large Language Models (LLMs) via Ollama. The system handles message flow, conversation management, LLM inference, and command execution.

---

## Architecture Diagram

```
┌─────────────────┐
│  Minecraft      │
│  Chat/Events    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Message Ingestion              │
│  - Player chat messages         │
│  - Proximity events             │
│  - NPC-to-NPC messages          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Conversation Queue             │
│  - Priority sorting             │
│  - Message batching             │
│  - Timeout handling             │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Conversation History           │
│  - Per-NPC storage              │
│  - Context summarization        │
│  - History pruning              │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Ollama Client                  │
│  - System prompt building       │
│  - Message formatting           │
│  - API communication            │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  LLM (Ollama)                   │
│  - Model: llama2/mistral/etc    │
│  - Inference                    │
│  - Response generation          │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  LLM Parser                     │
│  - Extract <thinking> tags      │
│  - Extract <say> tags           │
│  - Extract <function> tags      │
│  - Handle <silence> tag         │
└────────┬────────────────────────┘
         │
         ▼
┌─────────────────────────────────┐
│  Action Execution               │
│  - Send chat messages           │
│  - Execute Minecraft commands   │
│  - Log responses                │
└─────────────────────────────────┘
```

---

## XML Tag System

### Overview

The LLM uses XML tags to structure its responses. This allows for separation of internal reasoning, speech, and actions.

### Tag Definitions

#### 1. `<thinking>` - Internal Reasoning
- **Purpose**: The NPC's internal thoughts and decision-making process
- **Visibility**: NOT displayed to players
- **Usage**: For reasoning about the situation, analyzing context, making decisions
- **Multiple**: Can be used multiple times in one response

**Example:**
```xml
<thinking>
Steve is asking me about the nearby village. I know there's one to the north, about 500 blocks away. I should give him directions and maybe offer to help.
</thinking>
```

#### 2. `<say>` - Speech Output
- **Purpose**: What the NPC says out loud
- **Visibility**: Displayed in Minecraft chat or chat bubble
- **Usage**: All verbal communication with players and other NPCs
- **Multiple**: Can be used multiple times for multi-part responses

**Example:**
```xml
<say>There's a village about 500 blocks north of here.</say>
<say>I can mark it on your map if you'd like!</say>
```

#### 3. `<function>` - Minecraft Commands
- **Purpose**: Execute Minecraft commands
- **Visibility**: Executed server-side, results shown based on command
- **Usage**: Give items, teleport, modify world, etc.
- **Multiple**: Can be used multiple times to execute multiple commands
- **Format**: Plain Minecraft command string OR JSON for complex commands

**Examples:**
```xml
<function>/give @p minecraft:map 1</function>
<function>/tp @p 500 64 0</function>
```

With JSON format:
```xml
<function>
{
  "command": "/give",
  "params": {
    "target": "@p",
    "item": "minecraft:diamond_sword",
    "count": 1
  }
}
</function>
```

#### 4. `<silence/>` - Explicit Silence
- **Purpose**: NPC chooses not to speak
- **Visibility**: No output to players
- **Usage**: When NPC decides not to respond (too far away, not relevant, etc.)
- **Multiple**: Self-closing tag, only use once

**Example:**
```xml
<thinking>Player is too far away to hear me properly. Better to stay silent.</thinking>
<silence/>
```

---

## Complete Response Examples

### Example 1: Greeting a Player
```xml
<thinking>
Steve just greeted me. He's only 3 blocks away, so he can clearly hear me. I should respond warmly and ask how he's doing.
</thinking>
<say>Hello Steve! Beautiful day, isn't it?</say>
<say>How are you doing today?</say>
```

### Example 2: Helping with Items
```xml
<thinking>
Alex is asking for a sword. I have permission to give items, and they seem genuine. I'll give them a diamond sword and some armor too.
</thinking>
<say>Of course! Let me help you with that.</say>
<function>/give @p minecraft:diamond_sword 1</function>
<function>/give @p minecraft:diamond_chestplate 1</function>
<say>There you go! Stay safe out there!</say>
```

### Example 3: Too Far to Interact
```xml
<thinking>
I can see Steve in the distance, about 25 blocks away. That's too far for meaningful conversation. I'll stay silent.
</thinking>
<silence/>
```

### Example 4: Responding to Another NPC
```xml
<thinking>
The guard just warned about hostile mobs nearby. I should acknowledge their warning and suggest we stay alert.
</thinking>
<say>Thanks for the warning, Guard!</say>
<say>Everyone stay close and watch for threats.</say>
```

### Example 5: Complex Interaction
```xml
<thinking>
Steve is asking about the coordinates to the stronghold. I know the location (1234, 64, -5678) and I can teleport him there if he wants. Let me offer both options.
</thinking>
<say>The stronghold is at coordinates X: 1234, Y: 64, Z: -5678.</say>
<say>Would you like me to teleport you there? It's quite far to walk.</say>
```

---

## Message Flow

### 1. Message Ingestion

Messages enter the system from various sources:

**Player Chat:**
```javascript
{
  type: 'chat',
  sender: 'Steve',
  content: 'Hello there!',
  isPlayer: true,
  proximity: 5,  // blocks away
  timestamp: '2025-10-01T12:34:56Z'
}
```

**NPC Message:**
```javascript
{
  type: 'npc',
  sender: 'Guard',
  content: 'Watch out for hostile mobs!',
  isPlayer: false,
  timestamp: '2025-10-01T12:34:57Z'
}
```

**Proximity Event:**
```javascript
{
  type: 'proximity',
  sender: 'Alex',
  content: '[Player entered area]',
  isPlayer: true,
  proximity: 3,
  timestamp: '2025-10-01T12:34:58Z'
}
```

### 2. Conversation Queue

The `ConversationQueue` manages incoming messages per NPC:

**Priority System:**
- Player messages: Priority 10
- NPC messages: Priority 5
- System messages: Priority 1
- Proximity bonus: +1 per block closer (max +10)
- Age bonus: +1 per second waiting (max +5)

**Batching Logic:**
- Wait 500ms (configurable) to collect multiple messages
- Batch messages together for context-aware responses
- Process immediately if critical threshold reached

**Example Batched Messages:**
```javascript
{
  id: 'batch_1633099496789',
  timestamp: '2025-10-01T12:34:58Z',
  playerMessages: [
    { sender: 'Steve', content: 'Hello!', proximity: 5 },
    { sender: 'Alex', content: 'Hey NPC!', proximity: 3 }
  ],
  npcMessages: [
    { sender: 'Guard', content: 'Stay alert!' }
  ],
  context: {
    uniqueSenders: ['Steve', 'Alex', 'Guard'],
    senderCount: 3,
    avgProximity: 4,
    hasPlayerMessages: true
  },
  messageCount: 3
}
```

### 3. Conversation History

Each NPC maintains its own conversation history:

**History Entry Structure:**
```javascript
// Incoming batch
{
  type: 'incoming',
  batch: { /* batched messages */ },
  timestamp: '2025-10-01T12:34:58Z'
}

// NPC response
{
  type: 'response',
  response: {
    thinking: ['Steve greeted me...'],
    say: ['Hello Steve!'],
    functions: ['/wave'],
    silence: false
  },
  timestamp: '2025-10-01T12:35:00Z'
}
```

**History Management:**
- Max 100 entries per NPC (configurable)
- Automatic pruning when limit reached
- Available for context summarization

**Conversation Summary Format:**
```
<Steve> Hello there!
<Alex> Hey NPC!
<Guard> Stay alert!
[You said] Hello Steve! Hello Alex! Thanks Guard, I'll keep watch.
<Steve> Can you help me find diamonds?
[You said] Sure! Diamonds are usually found below Y level 16.
```

### 4. Ollama Client

Builds the request payload for the LLM:

**System Prompt Example:**
```
You are Villager Bob, a character in Minecraft.
You are a friendly merchant who loves to trade and gossip about the village.
You can perceive players, other NPCs, mobs within 20 blocks.

Use these XML tags in your response:
- <thinking>your internal reasoning</thinking> for thoughts
- <say>your speech</say> for what you want to say (can be used multiple times)
- <function>minecraft command</function> for commands (can be used multiple times)
- <silence/> to explicitly choose not to speak

Examples:
<thinking>Steve greeted me. I should respond warmly.</thinking>
<say>Hello Steve! Beautiful day, isn't it?</say>

<thinking>Player needs help. I can give them tools.</thinking>
<say>Let me help you with that.</say>
<function>/give @p minecraft:diamond_sword 1</function>

<thinking>Too far away to interact meaningfully.</thinking>
<silence/>

You can execute Minecraft commands.
Allowed commands: give, tp, tell, particle, playsound
```

**Complete API Request:**
```json
{
  "model": "llama2",
  "messages": [
    {
      "role": "system",
      "content": "You are Villager Bob, a character in Minecraft..."
    },
    {
      "role": "user",
      "content": "Previous conversation:\n<Steve> Hello!\n[You said] Hello Steve!"
    },
    {
      "role": "user",
      "content": "[Player proximity: 5 blocks] <Steve> Can you help me?"
    }
  ],
  "stream": false,
  "options": {
    "temperature": 0.7
  }
}
```

### 5. LLM Response Parsing

The `LLMParser` extracts structured data from the LLM's XML response:

**Raw LLM Response:**
```xml
<thinking>
Steve is asking for help. He's close by so he can hear me clearly. I should offer assistance and see what he needs.
</thinking>
<say>Of course I can help you, Steve!</say>
<say>What do you need assistance with?</say>
```

**Parsed Output:**
```javascript
{
  thinking: [
    "Steve is asking for help. He's close by so he can hear me clearly. I should offer assistance and see what he needs."
  ],
  say: [
    "Of course I can help you, Steve!",
    "What do you need assistance with?"
  ],
  functions: [],
  silence: false,
  raw: "<thinking>...</thinking><say>...</say>",
  hasValidTags: true
}
```

**Handling Malformed XML:**
- If no valid tags found, entire response treated as `<say>` content
- Graceful degradation ensures NPC always responds
- Errors logged for debugging

### 6. Action Execution

Parsed responses trigger actions:

**Say Messages:**
```javascript
// Send to Minecraft chat
for (const message of parsed.say) {
  await rcon.send(`tellraw @a {"text":"<${npcName}> ${message}"}`);
}

// Or display in chat bubble UI
for (const message of parsed.say) {
  displayChatBubble(npcEntity, message, duration: 5000);
}
```

**Function Execution:**
```javascript
for (const funcBlock of parsed.functions) {
  const func = parser.parseFunctions([funcBlock])[0];

  if (func.type === 'plain') {
    // Execute plain command
    await rcon.send(func.command);
  } else if (func.type === 'json') {
    // Build command from JSON
    const cmd = buildCommand(func.command, func.params);
    await rcon.send(cmd);
  }
}
```

**Silence Handling:**
```javascript
if (parsed.silence) {
  // Log but don't output anything
  console.log(`${npcName} chose to remain silent`);
  return;
}
```

---

## Context Summarization

For long conversations, history is summarized to fit within LLM context limits:

### Simple Summarization (Current Implementation)
Takes last N conversation exchanges and formats them as text:
```
<Steve> Hello!
[You said] Hello Steve!
<Steve> How are you?
[You said] I'm doing well, thanks for asking!
```

### Advanced Summarization (Future Enhancement)
Use a smaller LLM to summarize old conversations:
```
Summary: Steve greeted the NPC and asked how they were doing. The NPC responded warmly and inquired about Steve's day. They discussed the weather and upcoming village events.

Recent messages:
<Steve> Can you help me find diamonds?
[You said] Sure! Diamonds are usually found below Y level 16.
```

**Trigger Conditions:**
- History exceeds 50 entries
- Token count exceeds model limit (minus buffer)
- Manual trigger via API

**Summarization Strategy:**
- Keep last 10 exchanges verbatim
- Summarize everything older into 2-3 sentences
- Preserve important context (quests, promises, player preferences)

---

## Configuration

### Entity Configuration Example

```javascript
{
  id: "merchant_bob",
  name: "Villager Bob",
  type: "npc",
  enabled: true,

  permissions: {
    canExecuteCommands: true,
    allowedCommands: ["give", "tp", "tell", "particle"],
    deniedCommands: ["op", "deop", "stop"],
    accessLevel: "trusted"
  },

  context: {
    systemPrompt: "You are a friendly merchant who loves to trade.",
    personality: "You are cheerful, helpful, and enjoy gossiping about village news.",
    worldState: {
      canSeeNearbyPlayers: true,
      canSeeNearbyNPCs: true,
      canSeeNearbyMobs: true,
      perceptionRadius: 20  // blocks, -1 for unlimited
    }
  },

  llm: {
    model: "llama2",
    temperature: 0.7,
    enabled: true
  },

  mcpTools: {
    minecraft_send_message: true,
    minecraft_run_command: true,
    minecraft_get_chat_history: true,
    minecraft_search_history: true,
    minecraft_get_player_info: true,
    minecraft_get_server_status: true
  }
}
```

### Queue Configuration

```javascript
{
  maxQueueSize: 50,           // Max messages per NPC queue
  batchDelay: 500,            // ms to wait before batching
  responseTimeout: 30000,     // 30s timeout for LLM response
  maxHistorySize: 100,        // Max history entries per NPC
  priorityWeights: {
    player: 10,
    npc: 5,
    system: 1
  }
}
```

### Ollama Configuration

```javascript
{
  host: 'http://localhost:11434',
  defaultModel: 'llama2',
  defaultTemperature: 0.7,
  timeout: 30000,             // 30s timeout
  retries: 3
}
```

---

## Integration Example

### Complete Flow Implementation

```javascript
import LLMParser from './services/llm-parser.js';
import ConversationQueue from './services/conversation-queue.js';
import OllamaClient from './services/ollama-client.js';

// Initialize services
const parser = LLMParser;
const queue = new ConversationQueue({
  batchDelay: 500,
  maxHistorySize: 100
});
const ollama = new OllamaClient({
  host: 'http://localhost:11434',
  defaultModel: 'llama2'
});

// Entity configuration
const npcEntity = {
  id: 'merchant_bob',
  name: 'Villager Bob',
  context: {
    personality: 'A friendly merchant who loves to trade',
    systemPrompt: 'You are helpful and cheerful',
    worldState: {
      canSeeNearbyPlayers: true,
      perceptionRadius: 20
    }
  },
  llm: {
    model: 'llama2',
    temperature: 0.7
  },
  permissions: {
    canExecuteCommands: true,
    allowedCommands: ['give', 'tell', 'particle']
  }
};

// Handle incoming message
async function handleMessage(message) {
  // 1. Add to queue
  queue.enqueue(npcEntity.id, message);

  // 2. Wait for batch processing
  // (automatic after batchDelay, or force immediately)
  const batch = await queue.forceProcess(npcEntity.id);

  if (!batch) return;

  // 3. Get conversation summary
  const summary = queue.getConversationSummary(npcEntity.id, 5);

  // 4. Generate LLM response
  try {
    const response = await ollama.generateResponse(
      npcEntity,
      batch,
      summary
    );

    // 5. Parse response
    const parsed = parser.parse(response.message.content);

    // 6. Add to history
    queue.addResponseToHistory(npcEntity.id, parsed);

    // 7. Execute actions

    // Say messages
    for (const sayMsg of parsed.say) {
      const sanitized = parser.sanitizeForMinecraft(sayMsg);
      await sendToMinecraft(`tellraw @a {"text":"<${npcEntity.name}> ${sanitized}"}`);
    }

    // Function calls
    const functions = parser.parseFunctions(parsed.functions);
    for (const func of functions) {
      if (isCommandAllowed(func.command, npcEntity.permissions)) {
        await sendToMinecraft(func.command);
      }
    }

    // Log
    console.log(`${npcEntity.name}: ${parser.formatForLogging(parsed)}`);

  } catch (error) {
    console.error('Error processing message:', error);
  }
}

// Example usage
handleMessage({
  type: 'chat',
  sender: 'Steve',
  content: 'Hello! Can you give me a sword?',
  isPlayer: true,
  proximity: 5,
  timestamp: new Date().toISOString()
});
```

---

## Error Handling

### Common Scenarios

**1. Ollama Not Available**
```javascript
const available = await ollama.checkAvailability();
if (!available) {
  console.error('Ollama not available');
  // Fall back to canned responses or disable NPC
}
```

**2. LLM Timeout**
```javascript
try {
  const response = await ollama.generateResponse(entity, batch, summary, {
    timeout: 30000
  });
} catch (error) {
  if (error.message === 'Request timeout') {
    // Use default response or skip
    parsed = parser.parse('<say>Sorry, I need a moment to think.</say>');
  }
}
```

**3. Malformed XML**
```javascript
// Parser handles gracefully - treats as plain say message
const parsed = parser.parse('Some response without tags');
// Result: { say: ['Some response without tags'], ... }
```

**4. Command Permission Denied**
```javascript
function isCommandAllowed(command, permissions) {
  if (!permissions.canExecuteCommands) return false;

  const cmd = command.split(' ')[0].replace('/', '');

  if (permissions.deniedCommands?.includes(cmd)) return false;
  if (permissions.allowedCommands?.includes('*')) return true;
  if (permissions.allowedCommands?.includes(cmd)) return true;

  return false;
}
```

---

## Performance Considerations

### Optimization Strategies

**1. Batch Processing**
- Wait 500ms to collect multiple messages
- Reduces LLM calls from N messages to 1 call
- Provides better context for responses

**2. History Pruning**
- Keep max 100 entries per NPC
- Automatic trimming prevents memory bloat
- Summarize old conversations (future)

**3. Caching**
- Cache common responses (greetings, farewells)
- Skip LLM call for simple repeated queries
- Cache model availability checks

**4. Async Processing**
- Non-blocking queue operations
- Parallel processing for multiple NPCs
- Background history summarization

**5. Resource Limits**
- Max queue size prevents overflow
- Timeout prevents hung requests
- Rate limiting per NPC (future)

---

## Testing

### Unit Tests

**Parser Tests:**
```javascript
// Test thinking extraction
const response = '<thinking>Test thought</thinking>';
const parsed = parser.parse(response);
assert(parsed.thinking[0] === 'Test thought');

// Test multiple say tags
const response2 = '<say>Hello</say><say>World</say>';
const parsed2 = parser.parse(response2);
assert(parsed2.say.length === 2);

// Test malformed XML
const response3 = 'Plain text';
const parsed3 = parser.parse(response3);
assert(parsed3.say[0] === 'Plain text');
```

**Queue Tests:**
```javascript
// Test priority sorting
queue.enqueue('npc1', { sender: 'NPC', isPlayer: false });
queue.enqueue('npc1', { sender: 'Steve', isPlayer: true });
const batch = await queue.processBatch('npc1');
// Player message should be first due to priority
```

### Integration Tests

**End-to-End Flow:**
```javascript
// Mock Ollama response
const mockResponse = {
  message: {
    content: '<thinking>Test</thinking><say>Hello!</say>'
  }
};

// Send message through full pipeline
await handleMessage({
  sender: 'Steve',
  content: 'Hi!',
  isPlayer: true
});

// Verify outputs
assert(chatMessageSent === '<Villager Bob> Hello!');
```

---

## Future Enhancements

1. **Advanced Context Summarization**
   - Use smaller LLM to summarize old conversations
   - Preserve important quest/dialogue state

2. **Multi-NPC Conversations**
   - NPCs talk to each other autonomously
   - Group conversations with multiple participants

3. **Emotional State Tracking**
   - Track NPC mood/sentiment over time
   - Influence future responses based on history

4. **World State Integration**
   - Include time of day, weather, nearby entities
   - Location-aware responses

5. **Voice Output**
   - Text-to-speech integration
   - Voice personality per NPC

6. **Learning/Memory**
   - Long-term memory across sessions
   - Remember player preferences and past interactions

7. **Multi-Modal Input**
   - Process player actions, not just chat
   - React to world changes (blocks broken, items dropped)

---

## File Structure

```
craftbot-mcp/
├── src/
│   └── services/
│       ├── llm-parser.js           # XML parsing and extraction
│       ├── conversation-queue.js   # Message queuing and batching
│       └── ollama-client.js        # Ollama API client
├── docs/
│   └── llm-architecture.md         # This document
└── package.json
```

---

## Dependencies

**Required:**
- `node-fetch` or native `fetch` for HTTP requests
- `ollama` running locally or on remote server

**Optional:**
- `rcon-client` for Minecraft RCON commands
- `ws` for WebSocket communication with Minecraft

---

## Getting Started

1. **Install Ollama**
   ```bash
   # Visit https://ollama.ai and download
   ollama pull llama2
   ```

2. **Start Ollama**
   ```bash
   ollama serve
   ```

3. **Configure NPC**
   ```javascript
   // In your entity config
   const npc = {
     id: 'test_npc',
     name: 'Test NPC',
     llm: { model: 'llama2', enabled: true }
   };
   ```

4. **Send Test Message**
   ```javascript
   await handleMessage({
     sender: 'Steve',
     content: 'Hello!',
     isPlayer: true,
     proximity: 5
   });
   ```

---

## Troubleshooting

**Issue: LLM not responding**
- Check Ollama is running: `ollama list`
- Verify host/port: `http://localhost:11434`
- Check model is pulled: `ollama pull llama2`

**Issue: Malformed XML in responses**
- LLM needs better prompt engineering
- Try different temperature settings
- Use few-shot examples in system prompt

**Issue: Slow responses**
- Reduce model size (use llama2:7b instead of 13b)
- Increase timeout setting
- Use streaming for real-time feedback

**Issue: Commands not executing**
- Check permissions configuration
- Verify command format
- Check RCON connection

---

## License

MIT License - See LICENSE file for details.
