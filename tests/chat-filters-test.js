/**
 * Chat Filters Test
 * Tests the chat filtering logic for entities
 */

// Mock entity with chat filters
const testEntity = {
  id: 'test-npc',
  name: 'TestNPC',
  enabled: true,
  llm: { enabled: true },
  knowledge: {
    chatFilters: {
      respondToPlayers: true,
      respondToAI: false,
      requiresMention: false
    },
    proximityRequired: false
  },
  appearance: {}
};

// Test cases
const testCases = [
  {
    name: 'Player message - should respond',
    message: { isAI: false, player: 'Steve', message: 'Hello world' },
    entity: testEntity,
    expected: true
  },
  {
    name: 'AI message - should NOT respond (respondToAI: false)',
    message: { isAI: true, player: '[AI] Bob', message: 'Hello' },
    entity: testEntity,
    expected: false
  },
  {
    name: 'Player message with respondToPlayers: false - should NOT respond',
    message: { isAI: false, player: 'Steve', message: 'Hello' },
    entity: {
      ...testEntity,
      knowledge: {
        ...testEntity.knowledge,
        chatFilters: { ...testEntity.knowledge.chatFilters, respondToPlayers: false }
      }
    },
    expected: false
  },
  {
    name: 'Player mentions entity with requiresMention: true - should respond',
    message: { isAI: false, player: 'Steve', message: 'Hey TestNPC, how are you?' },
    entity: {
      ...testEntity,
      knowledge: {
        ...testEntity.knowledge,
        chatFilters: { ...testEntity.knowledge.chatFilters, requiresMention: true }
      }
    },
    expected: true
  },
  {
    name: 'Player does NOT mention entity with requiresMention: true - should NOT respond',
    message: { isAI: false, player: 'Steve', message: 'Hello world' },
    entity: {
      ...testEntity,
      knowledge: {
        ...testEntity.knowledge,
        chatFilters: { ...testEntity.knowledge.chatFilters, requiresMention: true }
      }
    },
    expected: false
  },
  {
    name: 'AI message with respondToAI: true - should respond',
    message: { isAI: true, player: '[AI] Bob', message: 'Hello TestNPC' },
    entity: {
      ...testEntity,
      knowledge: {
        ...testEntity.knowledge,
        chatFilters: { ...testEntity.knowledge.chatFilters, respondToAI: true }
      }
    },
    expected: true
  }
];

// Simple implementation of shouldEntityRespond logic for testing
function shouldEntityRespond(chatMessage, entity) {
  // If entity is disabled, don't respond
  if (!entity.enabled || !entity.llm?.enabled) {
    return false;
  }

  // Get chat filters (use defaults if not set)
  const chatFilters = entity.knowledge?.chatFilters || {
    respondToPlayers: true,
    respondToAI: false,
    requiresMention: false
  };

  // Check chat filters
  // If message is from AI and entity doesn't respond to AI
  if (chatMessage.isAI && !chatFilters.respondToAI) {
    return false;
  }

  // If message is from player and entity doesn't respond to players
  if (!chatMessage.isAI && !chatFilters.respondToPlayers) {
    return false;
  }

  // Check if mention is required
  if (chatFilters.requiresMention) {
    const normalizedMessage = chatMessage.message.toLowerCase();
    const normalizedNPC = entity.name.toLowerCase();
    const isMentioned = normalizedMessage.includes(normalizedNPC);
    if (!isMentioned) {
      return false;
    }
  }

  // All filters passed
  return true;
}

// Run tests
console.log('=== Chat Filters Test Suite ===\n');

let passed = 0;
let failed = 0;

testCases.forEach((testCase, index) => {
  const result = shouldEntityRespond(testCase.message, testCase.entity);
  const success = result === testCase.expected;

  if (success) {
    console.log(`✓ Test ${index + 1}: ${testCase.name}`);
    passed++;
  } else {
    console.log(`✗ Test ${index + 1}: ${testCase.name}`);
    console.log(`  Expected: ${testCase.expected}, Got: ${result}`);
    failed++;
  }
});

console.log(`\n=== Results ===`);
console.log(`Passed: ${passed}/${testCases.length}`);
console.log(`Failed: ${failed}/${testCases.length}`);

process.exit(failed > 0 ? 1 : 0);
