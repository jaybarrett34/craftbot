#!/usr/bin/env node

/**
 * Ollama Test Script for CraftBot-MCP
 *
 * Tests Ollama connection and XML tag generation with qwen2.5:14b-instruct
 * Verifies that the model can properly format responses with <thinking>, <say>, and <function> tags
 */

import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://localhost:11434';
const MODEL_NAME = process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'bright');
  console.log('='.repeat(60) + '\n');
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'cyan');
}

// Parse XML tags from response
function parseXMLTags(text) {
  const tags = {
    thinking: [],
    say: [],
    function: [],
    silence: false
  };

  // Extract thinking tags
  const thinkingRegex = /<thinking>([\s\S]*?)<\/thinking>/gi;
  let match;
  while ((match = thinkingRegex.exec(text)) !== null) {
    tags.thinking.push(match[1].trim());
  }

  // Extract say tags
  const sayRegex = /<say>([\s\S]*?)<\/say>/gi;
  while ((match = sayRegex.exec(text)) !== null) {
    tags.say.push(match[1].trim());
  }

  // Extract function tags
  const functionRegex = /<function>([\s\S]*?)<\/function>/gi;
  while ((match = functionRegex.exec(text)) !== null) {
    tags.function.push(match[1].trim());
  }

  // Check for silence tag
  tags.silence = /<silence\s*\/>/.test(text);

  return tags;
}

// Test Ollama connection
async function testConnection() {
  logSection('Testing Ollama Connection');

  try {
    const response = await fetch(`${OLLAMA_URL}/api/tags`);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    logSuccess(`Connected to Ollama at ${OLLAMA_URL}`);

    if (data.models && data.models.length > 0) {
      logInfo(`Found ${data.models.length} installed model(s):`);
      data.models.forEach(model => {
        const isCurrent = model.name === MODEL_NAME;
        const marker = isCurrent ? '→' : ' ';
        console.log(`  ${marker} ${model.name}`);
      });
    }

    // Check if target model exists
    const hasModel = data.models?.some(m => m.name === MODEL_NAME);
    if (hasModel) {
      logSuccess(`Model ${MODEL_NAME} is installed`);
      return true;
    } else {
      logError(`Model ${MODEL_NAME} is not installed`);
      logInfo(`Run: ollama pull ${MODEL_NAME}`);
      return false;
    }
  } catch (error) {
    logError(`Connection failed: ${error.message}`);
    logInfo('Make sure Ollama is running: ollama serve');
    return false;
  }
}

// Test basic chat completion
async function testChat(systemPrompt, userMessage, description) {
  console.log('\n' + '-'.repeat(60));
  log(`Test: ${description}`, 'bright');
  console.log('-'.repeat(60));

  logInfo(`User: ${userMessage}`);

  const messages = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: userMessage
    }
  ];

  try {
    const startTime = Date.now();

    const response = await fetch(`${OLLAMA_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        messages,
        stream: false,
        options: {
          temperature: 0.7,
          num_predict: 300
        }
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    const responseText = data.message?.content || '';

    console.log('\n' + 'Response:'.padEnd(60, '-'));
    console.log(responseText);
    console.log('-'.repeat(60));

    // Parse XML tags
    const tags = parseXMLTags(responseText);

    console.log('\n' + 'Parsed Tags:'.padEnd(60, '-'));

    if (tags.thinking.length > 0) {
      logSuccess(`<thinking> tags: ${tags.thinking.length}`);
      tags.thinking.forEach((t, i) => {
        console.log(`  ${i + 1}. ${colors.dim}${t}${colors.reset}`);
      });
    } else {
      logWarning('No <thinking> tags found');
    }

    if (tags.say.length > 0) {
      logSuccess(`<say> tags: ${tags.say.length}`);
      tags.say.forEach((s, i) => {
        console.log(`  ${i + 1}. "${s}"`);
      });
    } else if (!tags.silence) {
      logWarning('No <say> tags found (and no <silence/> tag)');
    }

    if (tags.function.length > 0) {
      logSuccess(`<function> tags: ${tags.function.length}`);
      tags.function.forEach((f, i) => {
        console.log(`  ${i + 1}. ${colors.cyan}${f}${colors.reset}`);
      });
    }

    if (tags.silence) {
      logInfo('Contains <silence/> tag');
    }

    console.log('-'.repeat(60));
    logInfo(`Response time: ${duration}s`);
    logInfo(`Tokens: ${data.eval_count || 'N/A'} generated`);

    return {
      success: true,
      tags,
      duration: parseFloat(duration),
      tokens: data.eval_count
    };

  } catch (error) {
    logError(`Chat failed: ${error.message}`);
    return {
      success: false,
      error: error.message
    };
  }
}

// Main test suite
async function runTests() {
  logSection('CraftBot-MCP Ollama Test Suite');

  logInfo(`Ollama URL: ${OLLAMA_URL}`);
  logInfo(`Model: ${MODEL_NAME}`);
  logInfo(`Temperature: 0.7`);

  // Test 1: Connection
  const connected = await testConnection();
  if (!connected) {
    logError('Cannot proceed without Ollama connection');
    process.exit(1);
  }

  // Test 2: Console entity greeting
  await testChat(
    `You are the Minecraft server console with full administrative access.

Use these XML tags in your response:
- <thinking>your internal reasoning</thinking> for thoughts
- <say>your speech</say> for what you want to say (can be used multiple times)
- <function>minecraft command</function> for commands (can be used multiple times)

Example:
<thinking>Player greeted me. I should respond professionally.</thinking>
<say>Hello! Server is running smoothly.</say>`,
    'Hello console! How are you?',
    'Console Entity - Basic Greeting'
  );

  // Test 3: Merchant NPC with command execution
  await testChat(
    `You are Marcus, a friendly merchant NPC in Minecraft. You sell tools and supplies.

Use these XML tags in your response:
- <thinking>your internal reasoning</thinking> for thoughts
- <say>your speech</say> for what you want to say (can be used multiple times)
- <function>minecraft command</function> for commands (can be used multiple times)

You can execute Minecraft commands. Allowed commands: give, tell

Example:
<thinking>Player wants to buy a sword. I'll give them one.</thinking>
<say>Here's a fine diamond sword for you!</say>
<function>/give @p minecraft:diamond_sword 1</function>`,
    'Can I buy a diamond sword?',
    'Merchant NPC - Item Transaction'
  );

  // Test 4: Silence tag usage
  await testChat(
    `You are a guard NPC in Minecraft. You only respond to players within 10 blocks.

Use these XML tags in your response:
- <thinking>your internal reasoning</thinking> for thoughts
- <say>your speech</say> for what you want to say (can be used multiple times)
- <silence/> to explicitly choose not to speak

Example of silence:
<thinking>Player is too far away to hear me.</thinking>
<silence/>`,
    '[Player proximity: 25 blocks] <Steve> Hello guard!',
    'Guard NPC - Silence Tag (Far Distance)'
  );

  // Test 5: Multiple say tags
  await testChat(
    `You are an excited quest giver NPC in Minecraft.

Use these XML tags in your response:
- <thinking>your internal reasoning</thinking> for thoughts
- <say>your speech</say> for what you want to say (can be used multiple times)

You can use <say> multiple times for conversational flow.

Example:
<thinking>This is exciting news!</thinking>
<say>Oh, you're here!</say>
<say>I've been waiting for a brave adventurer!</say>`,
    'Hi there! Do you have any quests?',
    'Quest Giver - Multiple Say Tags'
  );

  // Final summary
  logSection('Test Suite Complete');

  logSuccess('All tests completed!');
  console.log('\nKey findings:');
  console.log('  • Check if model consistently uses XML tags');
  console.log('  • Verify <thinking> shows internal reasoning');
  console.log('  • Ensure <say> contains appropriate responses');
  console.log('  • Confirm <function> has valid Minecraft commands');
  console.log('  • Test <silence/> for distance-based interactions');
  console.log('\nIf XML formatting is inconsistent, consider:');
  console.log('  • Adding more examples in system prompt');
  console.log('  • Adjusting temperature (lower = more consistent)');
  console.log('  • Using few-shot examples in conversation history');
}

// Run the tests
runTests().catch(error => {
  logError(`Fatal error: ${error.message}`);
  console.error(error);
  process.exit(1);
});
