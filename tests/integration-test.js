import { rconClient } from '../server/rcon-client.js';
import { ollamaClient } from '../server/ollama-client.js';
import { chatMonitor } from '../server/chat-monitor.js';
import { commandValidator } from '../server/command-validator.js';
import { stateFetcher } from '../server/state-fetcher.js';
import { llmParser } from '../server/llm-parser.js';
import { WebSocket } from 'ws';
import dotenv from 'dotenv';

dotenv.config();

// Test results
const results = {
  passed: [],
  failed: [],
  skipped: []
};

// Color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

// Helper functions
function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logTest(name) {
  console.log(`\n${colors.blue}► Testing: ${name}${colors.reset}`);
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`! ${message}`, 'yellow');
}

function logInfo(message) {
  log(`  ${message}`, 'gray');
}

function recordResult(test, passed, error = null) {
  if (passed) {
    results.passed.push(test);
    logSuccess(`${test} - PASSED`);
  } else {
    results.failed.push({ test, error });
    logError(`${test} - FAILED: ${error}`);
  }
}

function skip(test, reason) {
  results.skipped.push({ test, reason });
  logWarning(`${test} - SKIPPED: ${reason}`);
}

// Wait helper
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Test 1: RCON Connection
async function testRconConnection() {
  logTest('Test 1: RCON Connection');

  try {
    // Check if RCON is configured
    if (!process.env.RCON_HOST || !process.env.RCON_PASSWORD) {
      skip('RCON Connection', 'RCON not configured in .env');
      return;
    }

    logInfo('Attempting to connect to RCON...');
    const connected = await rconClient.connect();

    if (!connected) {
      recordResult('RCON Connection', false, 'Failed to connect');
      return;
    }

    logInfo('Connection established');

    // Test sending a command
    logInfo('Sending test command: list');
    const result = await rconClient.sendCommand('list');

    if (!result.success) {
      recordResult('RCON Connection', false, `Command failed: ${result.error}`);
      return;
    }

    logInfo(`Response: ${result.response}`);

    // Verify status
    const status = rconClient.getStatus();
    if (!status.connected) {
      recordResult('RCON Connection', false, 'Status shows not connected');
      return;
    }

    recordResult('RCON Connection', true);
  } catch (error) {
    recordResult('RCON Connection', false, error.message);
  }
}

// Test 2: Ollama Connection
async function testOllamaConnection() {
  logTest('Test 2: Ollama Connection');

  try {
    logInfo('Checking Ollama health...');
    const health = await ollamaClient.healthCheck();

    if (!health.available) {
      recordResult('Ollama Connection', false, 'Ollama not available');
      return;
    }

    logInfo('Ollama is available');

    // List models
    logInfo('Listing available models...');
    const modelsResult = await ollamaClient.listModels();

    if (!modelsResult.success) {
      recordResult('Ollama Connection', false, `Failed to list models: ${modelsResult.error}`);
      return;
    }

    logInfo(`Found ${modelsResult.models.length} models`);
    modelsResult.models.forEach(model => {
      logInfo(`  - ${model.name}`);
    });

    // Test a simple prompt
    logInfo('Testing chat completion...');
    const chatResult = await ollamaClient.chat([
      {
        role: 'system',
        content: 'You are a helpful assistant. Respond with only "test successful"'
      },
      {
        role: 'user',
        content: 'Say test successful'
      }
    ], {
      model: process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct',
      temperature: 0.1
    });

    if (!chatResult.success) {
      recordResult('Ollama Connection', false, `Chat failed: ${chatResult.error}`);
      return;
    }

    logInfo(`Response: ${chatResult.message.content}`);
    recordResult('Ollama Connection', true);
  } catch (error) {
    recordResult('Ollama Connection', false, error.message);
  }
}

// Test 3: Chat Monitor
async function testChatMonitor() {
  logTest('Test 3: Chat Monitor');

  try {
    // Test parsing a chat line
    const testLine = '[10:30:45] [Server thread/INFO]: <TestPlayer> Hello, world!';

    logInfo('Testing log line parsing...');
    let chatReceived = false;
    let chatMessage = null;

    const handler = (msg) => {
      chatReceived = true;
      chatMessage = msg;
    };

    chatMonitor.on('chat', handler);

    // Manually trigger the parser
    chatMonitor.processLogLine(testLine);

    // Wait a bit for event processing
    await wait(100);

    chatMonitor.off('chat', handler);

    if (!chatReceived) {
      recordResult('Chat Monitor', false, 'Chat event not received');
      return;
    }

    if (chatMessage.player !== 'TestPlayer') {
      recordResult('Chat Monitor', false, `Wrong player: ${chatMessage.player}`);
      return;
    }

    if (chatMessage.message !== 'Hello, world!') {
      recordResult('Chat Monitor', false, `Wrong message: ${chatMessage.message}`);
      return;
    }

    logInfo(`Parsed player: ${chatMessage.player}`);
    logInfo(`Parsed message: ${chatMessage.message}`);

    // Test stats
    const stats = chatMonitor.getStats();
    logInfo(`Monitor status: ${stats.monitoring ? 'active' : 'inactive'}`);
    logInfo(`History size: ${stats.historySize}`);

    recordResult('Chat Monitor', true);
  } catch (error) {
    recordResult('Chat Monitor', false, error.message);
  }
}

// Test 4: Command Validator
async function testCommandValidator() {
  logTest('Test 4: Command Validator');

  try {
    // Create test entity
    const testEntity = {
      id: 'test-entity',
      name: 'TestBot',
      permissions: {
        canExecuteCommands: true,
        level: 'environment',
        whitelistedCommands: ['weather', 'time', 'say'],
        blacklistedCommands: []
      }
    };

    // Test 1: Valid whitelisted command
    logInfo('Testing valid command: /weather clear');
    const validResult = commandValidator.validateCommand('/weather clear', testEntity);

    if (!validResult.valid) {
      recordResult('Command Validator', false, `Valid command rejected: ${validResult.error}`);
      return;
    }
    logInfo('✓ Valid command accepted');

    // Test 2: Non-whitelisted command
    logInfo('Testing non-whitelisted command: /ban');
    const invalidResult = commandValidator.validateCommand('/ban TestPlayer', testEntity);

    if (invalidResult.valid) {
      recordResult('Command Validator', false, 'Non-whitelisted command accepted');
      return;
    }
    logInfo('✓ Non-whitelisted command rejected');

    // Test 3: Permission level check
    const readonlyEntity = {
      ...testEntity,
      permissions: {
        ...testEntity.permissions,
        level: 'readonly'
      }
    };

    logInfo('Testing permission level with readonly entity');
    const permResult = commandValidator.validateCommand('/weather clear', readonlyEntity);

    if (permResult.valid) {
      recordResult('Command Validator', false, 'Low permission level accepted high-level command');
      return;
    }
    logInfo('✓ Permission level check working');

    // Test 4: Get allowed commands
    logInfo('Getting allowed commands for entity...');
    const allowed = commandValidator.getAllowedCommandsForEntity(testEntity);
    logInfo(`Found ${allowed.length} allowed commands`);

    recordResult('Command Validator', true);
  } catch (error) {
    recordResult('Command Validator', false, error.message);
  }
}

// Test 5: State Fetcher
async function testStateFetcher() {
  logTest('Test 5: State Fetcher');

  try {
    // Check if RCON is connected first
    if (!rconClient.isConnected()) {
      skip('State Fetcher', 'RCON not connected');
      return;
    }

    // Test getting world state
    logInfo('Fetching world state...');
    const worldState = await stateFetcher.getWorldState(['time', 'weather']);

    logInfo(`World state: ${JSON.stringify(worldState, null, 2)}`);

    // Test stats
    const stats = stateFetcher.getStats();
    logInfo(`Cache size: ${stats.cacheSize}`);
    logInfo(`Cache hits: ${stats.cacheHits}`);

    recordResult('State Fetcher', true);
  } catch (error) {
    recordResult('State Fetcher', false, error.message);
  }
}

// Test 6: LLM Parser
async function testLLMParser() {
  logTest('Test 6: LLM Parser');

  try {
    // Test parsing commands
    const testResponse1 = `
[THINK: The player wants to change the weather]
[COMMAND: /weather clear]
[CHAT: I'll make it sunny for you!]
`;

    logInfo('Testing tagged format parsing...');
    const parsed1 = llmParser.parseAndValidate(testResponse1);

    if (parsed1.commands.length !== 1) {
      recordResult('LLM Parser', false, `Expected 1 command, got ${parsed1.commands.length}`);
      return;
    }

    if (parsed1.chat.length !== 1) {
      recordResult('LLM Parser', false, `Expected 1 chat message, got ${parsed1.chat.length}`);
      return;
    }

    if (parsed1.thoughts.length !== 1) {
      recordResult('LLM Parser', false, `Expected 1 thought, got ${parsed1.thoughts.length}`);
      return;
    }

    logInfo(`✓ Parsed ${parsed1.commands.length} command(s)`);
    logInfo(`✓ Parsed ${parsed1.chat.length} chat message(s)`);
    logInfo(`✓ Parsed ${parsed1.thoughts.length} thought(s)`);

    // Test implicit format
    const testResponse2 = `
/time set day
Sure! I've set the time to day.
`;

    logInfo('Testing implicit format parsing...');
    const parsed2 = llmParser.parseAndValidate(testResponse2);

    if (parsed2.commands.length === 0) {
      recordResult('LLM Parser', false, 'Failed to parse implicit command');
      return;
    }

    if (parsed2.chat.length === 0) {
      recordResult('LLM Parser', false, 'Failed to parse implicit chat');
      return;
    }

    logInfo(`✓ Parsed ${parsed2.commands.length} command(s)`);
    logInfo(`✓ Parsed ${parsed2.chat.length} chat message(s)`);

    // Test text escaping
    logInfo('Testing Minecraft text escaping...');
    const escaped = llmParser.escapeMinecraftText('Test "quotes" and \\backslashes\\');
    if (!escaped.includes('\\"') || !escaped.includes('\\\\')) {
      recordResult('LLM Parser', false, 'Text escaping not working');
      return;
    }
    logInfo('✓ Text escaping working');

    recordResult('LLM Parser', true);
  } catch (error) {
    recordResult('LLM Parser', false, error.message);
  }
}

// Test 7: WebSocket
async function testWebSocket() {
  logTest('Test 7: WebSocket Connection');

  return new Promise((resolve) => {
    try {
      const serverPort = process.env.SERVER_PORT || 3000;
      const wsUrl = `ws://localhost:${serverPort}`;

      logInfo(`Connecting to ${wsUrl}...`);

      const ws = new WebSocket(wsUrl);
      let connectionReceived = false;

      const timeout = setTimeout(() => {
        ws.close();
        if (!connectionReceived) {
          recordResult('WebSocket Connection', false, 'Timeout - server may not be running');
        }
        resolve();
      }, 5000);

      ws.on('open', () => {
        logInfo('WebSocket connected');
      });

      ws.on('message', (data) => {
        try {
          const message = JSON.parse(data.toString());
          logInfo(`Received message type: ${message.type}`);

          if (message.type === 'connected') {
            connectionReceived = true;
            logInfo('✓ Received connection confirmation');

            // Test sending a message
            ws.send(JSON.stringify({
              type: 'ping',
              payload: { timestamp: Date.now() }
            }));

            logInfo('✓ Sent test message');

            clearTimeout(timeout);
            ws.close();
            recordResult('WebSocket Connection', true);
            resolve();
          }
        } catch (error) {
          clearTimeout(timeout);
          ws.close();
          recordResult('WebSocket Connection', false, `Message parsing error: ${error.message}`);
          resolve();
        }
      });

      ws.on('error', (error) => {
        clearTimeout(timeout);
        recordResult('WebSocket Connection', false, error.message);
        resolve();
      });

      ws.on('close', () => {
        logInfo('WebSocket closed');
      });
    } catch (error) {
      recordResult('WebSocket Connection', false, error.message);
      resolve();
    }
  });
}

// Test 8: Full Flow (End-to-End)
async function testFullFlow() {
  logTest('Test 8: Full Flow (Chat → LLM → Command)');

  try {
    // Check prerequisites
    if (!rconClient.isConnected()) {
      skip('Full Flow', 'RCON not connected');
      return;
    }

    const ollamaHealth = await ollamaClient.healthCheck();
    if (!ollamaHealth.available) {
      skip('Full Flow', 'Ollama not available');
      return;
    }

    // Create test entity
    const testEntity = {
      id: 'test-bot',
      name: 'TestBot',
      enabled: true,
      llm: {
        enabled: true,
        model: process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct',
        temperature: 0.7
      },
      permissions: {
        canExecuteCommands: true,
        level: 'environment',
        whitelistedCommands: ['*'],
        blacklistedCommands: ['ban', 'op', 'deop', 'stop']
      },
      knowledge: {
        canAccessWorldState: true
      }
    };

    // Simulate a chat message
    const chatMessage = {
      player: 'TestPlayer',
      message: 'What time is it?',
      timestamp: new Date().toISOString()
    };

    logInfo('Step 1: Processing chat message');
    logInfo(`  Player: ${chatMessage.player}`);
    logInfo(`  Message: ${chatMessage.message}`);

    // Build context
    logInfo('Step 2: Building LLM context');
    const context = [
      {
        role: 'system',
        content: `You are ${testEntity.name}, a helpful bot in Minecraft. You can execute commands using [COMMAND: /command] and chat using [CHAT: message]. Keep responses brief.`
      },
      {
        role: 'user',
        content: `${chatMessage.player}: ${chatMessage.message}`
      }
    ];

    // Get LLM response
    logInfo('Step 3: Getting LLM response');
    const llmResult = await ollamaClient.chat(context, {
      model: testEntity.llm.model,
      temperature: testEntity.llm.temperature
    });

    if (!llmResult.success) {
      recordResult('Full Flow', false, `LLM error: ${llmResult.error}`);
      return;
    }

    const llmResponse = llmResult.message.content;
    logInfo(`  LLM Response: ${llmResponse}`);

    // Parse response
    logInfo('Step 4: Parsing LLM response');
    const parsed = llmParser.parseAndValidate(llmResponse);
    logInfo(`  Commands: ${parsed.commands.length}`);
    logInfo(`  Chat messages: ${parsed.chat.length}`);

    // Validate commands
    logInfo('Step 5: Validating commands');
    let validCommands = 0;
    let invalidCommands = 0;

    for (const cmd of parsed.commands) {
      const validation = commandValidator.validateCommand(cmd.command, testEntity);
      if (validation.valid) {
        validCommands++;
        logInfo(`  ✓ ${cmd.command} - valid`);
      } else {
        invalidCommands++;
        logInfo(`  ✗ ${cmd.command} - ${validation.error}`);
      }
    }

    logInfo(`Step 6: Flow complete`);
    logInfo(`  Valid commands: ${validCommands}`);
    logInfo(`  Invalid commands: ${invalidCommands}`);
    logInfo(`  Chat messages to send: ${parsed.chat.length}`);

    // Consider it successful if we got a response and parsed it
    if (parsed.chat.length > 0 || parsed.commands.length > 0) {
      recordResult('Full Flow', true);
    } else {
      recordResult('Full Flow', false, 'No actionable output from LLM');
    }
  } catch (error) {
    recordResult('Full Flow', false, error.message);
  }
}

// Print summary
function printSummary() {
  console.log('\n' + '='.repeat(60));
  log('TEST SUMMARY', 'cyan');
  console.log('='.repeat(60));

  log(`\n✓ Passed: ${results.passed.length}`, 'green');
  results.passed.forEach(test => {
    log(`  - ${test}`, 'green');
  });

  if (results.failed.length > 0) {
    log(`\n✗ Failed: ${results.failed.length}`, 'red');
    results.failed.forEach(({ test, error }) => {
      log(`  - ${test}: ${error}`, 'red');
    });
  }

  if (results.skipped.length > 0) {
    log(`\n! Skipped: ${results.skipped.length}`, 'yellow');
    results.skipped.forEach(({ test, reason }) => {
      log(`  - ${test}: ${reason}`, 'yellow');
    });
  }

  const total = results.passed.length + results.failed.length + results.skipped.length;
  const passRate = total > 0 ? ((results.passed.length / (total - results.skipped.length)) * 100).toFixed(1) : 0;

  console.log('\n' + '='.repeat(60));
  log(`Total Tests: ${total}`, 'cyan');
  log(`Pass Rate: ${passRate}% (excluding skipped)`, passRate >= 80 ? 'green' : 'red');
  console.log('='.repeat(60) + '\n');

  return results.failed.length === 0;
}

// Main test runner
async function runTests() {
  log('\n╔════════════════════════════════════════════════════════╗', 'cyan');
  log('║       CRAFTBOT MCP - INTEGRATION TEST SUITE          ║', 'cyan');
  log('╚════════════════════════════════════════════════════════╝', 'cyan');

  logInfo(`Environment: ${process.env.NODE_ENV || 'development'}`);
  logInfo(`Server Port: ${process.env.SERVER_PORT || 3000}`);
  logInfo(`RCON Host: ${process.env.RCON_HOST || 'not configured'}`);
  logInfo(`Ollama URL: ${process.env.OLLAMA_URL || 'http://localhost:11434'}`);
  logInfo(`Ollama Model: ${process.env.OLLAMA_MODEL || 'llama2'}`);

  // Run all tests
  await testRconConnection();
  await testOllamaConnection();
  await testChatMonitor();
  await testCommandValidator();
  await testStateFetcher();
  await testLLMParser();
  await testWebSocket();
  await testFullFlow();

  // Print summary
  const allPassed = printSummary();

  // Exit with appropriate code
  process.exit(allPassed ? 0 : 1);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  logError(`Unhandled rejection: ${error.message}`);
  process.exit(1);
});

// Run tests
runTests().catch((error) => {
  logError(`Fatal error: ${error.message}`);
  process.exit(1);
});
