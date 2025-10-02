# Quick Start Guide - LLM AI NPCs

## Prerequisites

1. **Install Ollama**
   ```bash
   # Visit https://ollama.ai and download for your OS
   # Or on macOS:
   brew install ollama
   ```

2. **Pull a Model**
   ```bash
   ollama pull llama2
   # Or other models: mistral, codellama, phi, etc.
   ```

3. **Start Ollama**
   ```bash
   ollama serve
   # Should run on http://localhost:11434
   ```

---

## Basic Setup (5 Minutes)

### 1. Import the Integration

```javascript
import LLMIntegration from './src/services/llm-integration.js';

const llm = new LLMIntegration({
  ollama: {
    host: 'http://localhost:11434',
    defaultModel: 'llama2'
  },
  onSay: async (entity, message) => {
    // Send to Minecraft chat
    console.log(`${entity.name}: ${message}`);
  }
});
```

### 2. Register an NPC

```javascript
llm.registerEntity({
  id: 'my_npc',
  name: 'Bob the Villager',
  llm: {
    model: 'llama2',
    temperature: 0.7,
    enabled: true
  },
  context: {
    personality: 'You are a friendly merchant who loves to trade.'
  },
  permissions: {
    canExecuteCommands: true,
    allowedCommands: ['give', 'tell']
  }
});
```

### 3. Send a Message

```javascript
await llm.handleMessage('my_npc', {
  sender: 'Steve',
  content: 'Hello!',
  isPlayer: true,
  proximity: 5
});

// Process the response
await llm.processEntity('my_npc');
```

---

## XML Response Format

Your LLM will respond using these tags:

```xml
<thinking>Internal reasoning (not shown to players)</thinking>
<say>What the NPC says out loud</say>
<function>/minecraft command to execute</function>
<silence/> <!-- Choose not to respond -->
```

### Example Response

```xml
<thinking>
Steve greeted me and is close by. I should respond warmly.
</thinking>
<say>Hello Steve! How can I help you today?</say>
```

---

## Common Patterns

### Pattern 1: Simple Chat
```javascript
// Player says something
await llm.handleMessage('npc_id', {
  sender: 'Steve',
  content: 'Hello!',
  isPlayer: true,
  proximity: 5
});

await llm.processEntity('npc_id');
```

### Pattern 2: Give Items
```xml
<thinking>Player needs a sword. I can help.</thinking>
<say>Here's a sword for you!</say>
<function>/give @p minecraft:diamond_sword 1</function>
```

### Pattern 3: Too Far Away
```xml
<thinking>Player is 30 blocks away. Too far to interact.</thinking>
<silence/>
```

### Pattern 4: Multiple Actions
```xml
<say>Let me help you with that!</say>
<function>/give @p diamond_sword 1</function>
<function>/give @p diamond_pickaxe 1</function>
<say>There you go! Stay safe!</say>
```

---

## Auto-Processing Mode

Let the system automatically process messages:

```javascript
// Start auto-processing every 1 second
llm.startAutoProcessing(1000);

// Now just add messages, they'll be processed automatically
await llm.handleMessage('npc_id', {
  sender: 'Steve',
  content: 'Hello!'
});

// Stop when done
llm.stopAutoProcessing();
```

---

## Message Priority

Messages are automatically prioritized:

1. **Player messages** (Priority 10)
2. **Proximity bonus** (+10 to +1 based on distance)
3. **NPC messages** (Priority 5)
4. **Age bonus** (+1 per second waiting)

Closer players get faster responses!

---

## Conversation History

The system automatically tracks conversation history:

```javascript
// Get last 5 conversation exchanges
const summary = llm.queue.getConversationSummary('npc_id', 5);

// Clear history if needed
llm.queue.clearHistory('npc_id');
```

---

## Command Permissions

Control what commands NPCs can execute:

```javascript
permissions: {
  canExecuteCommands: true,
  allowedCommands: ['give', 'tp', 'tell'],  // Only these
  deniedCommands: ['op', 'deop', 'stop'],   // Never these
}
```

Use `['*']` for all commands (be careful!).

---

## Configuration Options

### Ollama Options
```javascript
ollama: {
  host: 'http://localhost:11434',
  defaultModel: 'llama2',
  defaultTemperature: 0.7,
  timeout: 30000,  // 30 seconds
  retries: 3
}
```

### Queue Options
```javascript
queue: {
  maxQueueSize: 50,        // Max messages per NPC
  batchDelay: 500,         // Wait 500ms to batch messages
  responseTimeout: 30000,  // 30s timeout
  maxHistorySize: 100      // Keep last 100 exchanges
}
```

### Temperature Guide
- **0.3-0.5**: Focused, predictable (guards, merchants)
- **0.6-0.8**: Balanced, natural (villagers)
- **0.9-1.2**: Creative, random (crazy NPCs)

---

## Debugging

### Check System Status
```javascript
// Check if Ollama is running
const available = await llm.checkOllamaAvailability();
console.log('Ollama:', available ? 'online' : 'offline');

// List available models
const models = await llm.listModels();
console.log('Models:', models);

// Get queue stats
const stats = llm.getStats();
console.log('Stats:', stats);
```

### Enable Logging
```javascript
// Parser logging
const parsed = LLMParser.parse(response);
console.log(LLMParser.formatForLogging(parsed));

// Queue stats
console.log('Queue size:', llm.queue.getQueueSize('npc_id'));
console.log('Processing:', llm.queue.isProcessing('npc_id'));
```

---

## Testing

Run the test suite:

```bash
node tests/llm-parser.test.js
```

Run examples:

```bash
node examples/llm-usage-example.js
```

---

## Troubleshooting

### "Ollama not available"
- Check Ollama is running: `ollama list`
- Verify URL: `http://localhost:11434`
- Try: `ollama serve`

### "Request timeout"
- Increase timeout in config
- Try smaller model (llama2:7b instead of 13b)
- Check Ollama server logs

### "No response from NPC"
- Check `entity.llm.enabled = true`
- Verify queue has messages: `getQueueSize()`
- Check Ollama logs for errors

### "Commands not executing"
- Verify `permissions.canExecuteCommands = true`
- Check command is in `allowedCommands`
- Check command is not in `deniedCommands`

### "Malformed XML responses"
- Try lower temperature (0.5-0.7)
- Add more examples to system prompt
- Try different model (mistral, phi)

---

## Production Tips

1. **Rate Limiting**: Limit requests per NPC to avoid spam
2. **Caching**: Cache common responses (greetings, farewells)
3. **Fallbacks**: Have default responses if LLM fails
4. **Monitoring**: Log all LLM calls for debugging
5. **Model Selection**:
   - `llama2:7b` - Fast, good for simple NPCs
   - `mistral:7b` - Better quality, slightly slower
   - `llama2:13b` - Best quality, slower

---

## Next Steps

1. **Read**: `/docs/llm-architecture.md` for full details
2. **Explore**: `/examples/llm-usage-example.js` for more patterns
3. **Test**: `/tests/llm-parser.test.js` to verify setup
4. **Build**: Create your own custom NPCs!

---

## Support

- **Documentation**: `/docs/llm-architecture.md`
- **Examples**: `/examples/llm-usage-example.js`
- **Tests**: `/tests/llm-parser.test.js`
- **Ollama Docs**: https://ollama.ai/docs

---

## Quick Reference

```javascript
// Initialize
const llm = new LLMIntegration({ /* config */ });

// Register NPC
llm.registerEntity({ id, name, llm: { model, enabled } });

// Send message
await llm.handleMessage(npcId, { sender, content, isPlayer, proximity });

// Process
await llm.processEntity(npcId);

// Or auto-process
llm.startAutoProcessing(1000);

// Check status
await llm.checkOllamaAvailability();
await llm.listModels();
llm.getStats();
```

---

Happy building! 🎮🤖
