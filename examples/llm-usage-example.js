/**
 * LLM Integration Usage Example
 *
 * Demonstrates how to use the LLM system with AI NPCs
 */

import LLMIntegration from '../src/services/llm-integration.js';

// Initialize the integration
const llmManager = new LLMIntegration({
  queue: {
    batchDelay: 500,
    maxHistorySize: 100
  },
  ollama: {
    host: 'http://localhost:11434',
    defaultModel: 'qwen2.5:14b-instruct',
    defaultTemperature: 0.7
  },
  // Callbacks for actions
  onSay: async (entity, message) => {
    console.log(`\n💬 ${entity.name} says: "${message}"\n`);
    // Send to Minecraft via RCON:
    // await rcon.send(`tellraw @a {"text":"<${entity.name}> ${message}"}`);
  },
  onFunction: async (entity, func) => {
    console.log(`\n⚡ ${entity.name} executes: ${func.command}\n`);
    // Execute via RCON:
    // await rcon.send(func.command);
  },
  onError: (entity, error) => {
    console.error(`\n❌ Error for ${entity.name}:`, error.message, '\n');
  }
});

// Define NPCs
const villagerBob = {
  id: 'villager_bob',
  name: 'Villager Bob',
  type: 'npc',
  enabled: true,

  permissions: {
    canExecuteCommands: true,
    allowedCommands: ['give', 'tp', 'tell', 'particle', 'playsound'],
    deniedCommands: ['op', 'deop', 'stop', 'ban'],
    accessLevel: 'trusted'
  },

  context: {
    systemPrompt: 'You are a friendly merchant in a medieval village.',
    personality: 'You are cheerful, helpful, and love to gossip about village news. You enjoy trading and meeting new people.',
    worldState: {
      canSeeNearbyPlayers: true,
      canSeeNearbyNPCs: true,
      canSeeNearbyMobs: true,
      perceptionRadius: 20
    }
  },

  llm: {
    model: 'qwen2.5:14b-instruct',
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
};

const guardKnight = {
  id: 'guard_knight',
  name: 'Sir Reginald',
  type: 'npc',
  enabled: true,

  permissions: {
    canExecuteCommands: true,
    allowedCommands: ['tp', 'particle', 'playsound', 'effect'],
    deniedCommands: ['give', 'op', 'deop', 'stop'],
    accessLevel: 'guard'
  },

  context: {
    systemPrompt: 'You are a noble knight guarding the village entrance.',
    personality: 'You are brave, honorable, and take your duty seriously. You are protective of villagers and cautious of strangers.',
    worldState: {
      canSeeNearbyPlayers: true,
      canSeeNearbyNPCs: true,
      canSeeNearbyMobs: true,
      perceptionRadius: 30
    }
  },

  llm: {
    model: 'qwen2.5:14b-instruct',
    temperature: 0.6,
    enabled: true
  },

  mcpTools: {
    minecraft_send_message: true,
    minecraft_run_command: true,
    minecraft_get_chat_history: true,
    minecraft_get_player_info: true
  }
};

// Register NPCs
llmManager.registerEntity(villagerBob);
llmManager.registerEntity(guardKnight);

// Example 1: Simple greeting
async function example1_SimpleGreeting() {
  console.log('\n=== Example 1: Simple Greeting ===\n');

  await llmManager.handleMessage('villager_bob', {
    type: 'chat',
    sender: 'Steve',
    content: 'Hello there!',
    isPlayer: true,
    proximity: 5,
    timestamp: new Date().toISOString()
  });

  // Process immediately (or wait for auto-processing)
  await llmManager.processEntity('villager_bob');
}

// Example 2: Request for help
async function example2_RequestHelp() {
  console.log('\n=== Example 2: Request for Help ===\n');

  await llmManager.handleMessage('villager_bob', {
    type: 'chat',
    sender: 'Alex',
    content: 'I need a sword and some food. Can you help?',
    isPlayer: true,
    proximity: 3,
    timestamp: new Date().toISOString()
  });

  await llmManager.processEntity('villager_bob');
}

// Example 3: Multiple messages batching
async function example3_BatchedMessages() {
  console.log('\n=== Example 3: Batched Messages ===\n');

  // Multiple players talking at once
  await llmManager.handleMessage('guard_knight', {
    type: 'chat',
    sender: 'Steve',
    content: 'Guard! There are zombies coming!',
    isPlayer: true,
    proximity: 8,
    timestamp: new Date().toISOString()
  });

  await llmManager.handleMessage('guard_knight', {
    type: 'chat',
    sender: 'Alex',
    content: 'Help! We need protection!',
    isPlayer: true,
    proximity: 10,
    timestamp: new Date().toISOString()
  });

  // Wait a bit for batching
  await new Promise(resolve => setTimeout(resolve, 600));

  // Process (should handle both messages together)
  await llmManager.processEntity('guard_knight');
}

// Example 4: NPC-to-NPC communication
async function example4_NPCtoNPC() {
  console.log('\n=== Example 4: NPC-to-NPC Communication ===\n');

  await llmManager.handleMessage('villager_bob', {
    type: 'npc',
    sender: 'Sir Reginald',
    content: 'Bob, have you seen any suspicious strangers around?',
    isPlayer: false,
    timestamp: new Date().toISOString()
  });

  await llmManager.processEntity('villager_bob');
}

// Example 5: Proximity event (player too far)
async function example5_TooFar() {
  console.log('\n=== Example 5: Player Too Far ===\n');

  await llmManager.handleMessage('villager_bob', {
    type: 'chat',
    sender: 'Steve',
    content: 'Hey Bob!',
    isPlayer: true,
    proximity: 30, // Too far
    timestamp: new Date().toISOString()
  });

  await llmManager.processEntity('villager_bob');
}

// Example 6: Conversation with history
async function example6_ConversationWithHistory() {
  console.log('\n=== Example 6: Conversation with History ===\n');

  // First message
  await llmManager.handleMessage('villager_bob', {
    type: 'chat',
    sender: 'Steve',
    content: 'Do you know where I can find diamonds?',
    isPlayer: true,
    proximity: 4,
    timestamp: new Date().toISOString()
  });

  await llmManager.processEntity('villager_bob');

  // Wait a bit
  await new Promise(resolve => setTimeout(resolve, 1000));

  // Follow-up message (NPC should remember context)
  await llmManager.handleMessage('villager_bob', {
    type: 'chat',
    sender: 'Steve',
    content: 'Thanks! How deep should I dig?',
    isPlayer: true,
    proximity: 4,
    timestamp: new Date().toISOString()
  });

  await llmManager.processEntity('villager_bob');
}

// Example 7: Check system status
async function example7_SystemStatus() {
  console.log('\n=== Example 7: System Status ===\n');

  // Check Ollama availability
  const available = await llmManager.checkOllamaAvailability();
  console.log(`Ollama available: ${available}`);

  // List models
  const models = await llmManager.listModels();
  console.log(`Available models: ${models.join(', ')}`);

  // Get stats
  const stats = llmManager.getStats();
  console.log('System stats:', JSON.stringify(stats, null, 2));
}

// Example 8: Auto-processing mode
async function example8_AutoProcessing() {
  console.log('\n=== Example 8: Auto-Processing Mode ===\n');

  // Start auto-processing (checks every 1 second)
  llmManager.startAutoProcessing(1000);

  // Now just enqueue messages, they'll be processed automatically
  await llmManager.handleMessage('villager_bob', {
    type: 'chat',
    sender: 'Steve',
    content: 'Hello!',
    isPlayer: true,
    proximity: 5,
    timestamp: new Date().toISOString()
  });

  // Wait for auto-processing
  await new Promise(resolve => setTimeout(resolve, 2000));

  // Stop auto-processing
  llmManager.stopAutoProcessing();
}

// Run all examples
async function runAllExamples() {
  try {
    // Check if Ollama is available first
    const available = await llmManager.checkOllamaAvailability();

    if (!available) {
      console.error('\n❌ Ollama is not available. Please start Ollama first:\n');
      console.error('   ollama serve\n');
      console.error('Then ensure you have a model installed:\n');
      console.error('   ollama pull qwen2.5:14b-instruct\n');
      return;
    }

    console.log('✅ Ollama is available!\n');

    // Run examples (comment out ones you don't want to run)
    await example1_SimpleGreeting();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await example2_RequestHelp();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await example3_BatchedMessages();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await example4_NPCtoNPC();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await example5_TooFar();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await example6_ConversationWithHistory();
    await new Promise(resolve => setTimeout(resolve, 1000));

    await example7_SystemStatus();

    // Uncomment to test auto-processing:
    // await example8_AutoProcessing();

    console.log('\n✅ All examples completed!\n');

  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllExamples();
}

export {
  llmManager,
  villagerBob,
  guardKnight,
  runAllExamples
};
