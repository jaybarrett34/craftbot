import { xmlInstructionsBuilder } from '../server/xml-instructions-builder.js';

// Test entity configurations
const testEntities = [
  {
    id: 'test-admin',
    name: 'Admin Console',
    permissions: {
      level: 'admin',
      whitelistedCommands: ['*'],
      blacklistedCommands: [],
      canExecuteCommands: true
    },
    personality: {
      characterContext: 'You are the all-powerful server console.'
    }
  },
  {
    id: 'test-readonly',
    name: 'Observer Bot',
    permissions: {
      level: 'readonly',
      whitelistedCommands: [],
      blacklistedCommands: [],
      canExecuteCommands: false
    },
    personality: {
      characterContext: 'You are a friendly observer who watches and comments.'
    }
  },
  {
    id: 'test-environment',
    name: 'Weather Controller',
    permissions: {
      level: 'environment',
      whitelistedCommands: ['time', 'weather', 'say'],
      blacklistedCommands: [],
      canExecuteCommands: true
    },
    personality: {
      characterContext: 'You are a weather wizard who controls time and climate.'
    }
  },
  {
    id: 'test-legacy',
    name: 'Legacy Entity',
    permissions: {
      level: 'mod',
      whitelistedCommands: ['*'],
      blacklistedCommands: ['stop', 'ban'],
      canExecuteCommands: true
    },
    personality: {
      systemPrompt: `You are a legacy moderator bot with old-style prompts.

RESPONSE FORMAT - blah blah
CRITICAL RULES - blah blah
AVAILABLE COMMANDS - blah blah`
    }
  }
];

console.log('='.repeat(80));
console.log('XML INSTRUCTIONS BUILDER TEST');
console.log('='.repeat(80));

for (const entity of testEntities) {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`Entity: ${entity.name} (${entity.permissions.level})`);
  console.log('='.repeat(80));

  const fullPrompt = xmlInstructionsBuilder.buildFullSystemPrompt(entity);

  console.log(fullPrompt);
  console.log('\n' + '-'.repeat(80));
  console.log(`Character Context Length: ${entity.personality.characterContext?.length || 0} chars`);
  console.log(`Full Prompt Length: ${fullPrompt.length} chars`);
  console.log(`Instructions Added: ${fullPrompt.length - (entity.personality.characterContext?.length || 0)} chars`);
}

console.log('\n' + '='.repeat(80));
console.log('TEST COMPLETE');
console.log('='.repeat(80));
