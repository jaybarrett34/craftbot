/**
 * LLM Parser Test Suite
 *
 * Tests for XML tag parsing and response handling
 */

import LLMParser from '../src/services/llm-parser.js';

// Simple test runner
class TestRunner {
  constructor() {
    this.tests = [];
    this.passed = 0;
    this.failed = 0;
  }

  test(name, fn) {
    this.tests.push({ name, fn });
  }

  assert(condition, message) {
    if (!condition) {
      throw new Error(message || 'Assertion failed');
    }
  }

  assertEqual(actual, expected, message) {
    if (actual !== expected) {
      throw new Error(message || `Expected ${expected}, got ${actual}`);
    }
  }

  assertArrayEqual(actual, expected, message) {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(message || `Expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
  }

  async run() {
    console.log(`\n🧪 Running ${this.tests.length} tests...\n`);

    for (const test of this.tests) {
      try {
        await test.fn(this);
        console.log(`✅ ${test.name}`);
        this.passed++;
      } catch (error) {
        console.log(`❌ ${test.name}`);
        console.log(`   Error: ${error.message}\n`);
        this.failed++;
      }
    }

    console.log(`\n📊 Results: ${this.passed} passed, ${this.failed} failed\n`);
    return this.failed === 0;
  }
}

const runner = new TestRunner();

// Test 1: Parse single thinking tag
runner.test('Parse single thinking tag', (t) => {
  const response = '<thinking>This is a test thought</thinking>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.thinking.length, 1);
  t.assertEqual(parsed.thinking[0], 'This is a test thought');
  t.assert(parsed.hasValidTags);
});

// Test 2: Parse multiple thinking tags
runner.test('Parse multiple thinking tags', (t) => {
  const response = '<thinking>First thought</thinking><thinking>Second thought</thinking>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.thinking.length, 2);
  t.assertEqual(parsed.thinking[0], 'First thought');
  t.assertEqual(parsed.thinking[1], 'Second thought');
});

// Test 3: Parse single say tag
runner.test('Parse single say tag', (t) => {
  const response = '<say>Hello world!</say>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.say.length, 1);
  t.assertEqual(parsed.say[0], 'Hello world!');
});

// Test 4: Parse multiple say tags
runner.test('Parse multiple say tags', (t) => {
  const response = '<say>Hello!</say><say>How are you?</say>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.say.length, 2);
  t.assertEqual(parsed.say[0], 'Hello!');
  t.assertEqual(parsed.say[1], 'How are you?');
});

// Test 5: Parse single function tag
runner.test('Parse single function tag', (t) => {
  const response = '<function>/give @p diamond 1</function>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.functions.length, 1);
  t.assertEqual(parsed.functions[0], '/give @p diamond 1');
});

// Test 6: Parse multiple function tags
runner.test('Parse multiple function tags', (t) => {
  const response = '<function>/give @p sword 1</function><function>/tp @p 0 64 0</function>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.functions.length, 2);
  t.assertEqual(parsed.functions[0], '/give @p sword 1');
  t.assertEqual(parsed.functions[1], '/tp @p 0 64 0');
});

// Test 7: Parse silence tag
runner.test('Parse silence tag', (t) => {
  const response = '<silence/>';
  const parsed = LLMParser.parse(response);

  t.assert(parsed.silence);
  t.assert(parsed.hasValidTags);
});

// Test 8: Parse complete response with all tags
runner.test('Parse complete response with all tags', (t) => {
  const response = `
    <thinking>Steve asked for help. I should give him items.</thinking>
    <say>Of course I can help!</say>
    <function>/give @p diamond_sword 1</function>
    <say>There you go!</say>
  `;
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.thinking.length, 1);
  t.assertEqual(parsed.say.length, 2);
  t.assertEqual(parsed.functions.length, 1);
  t.assert(!parsed.silence);
  t.assert(parsed.hasValidTags);
});

// Test 9: Parse multiline content
runner.test('Parse multiline content', (t) => {
  const response = `
    <thinking>
    This is a multiline
    thinking block
    </thinking>
  `;
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.thinking.length, 1);
  t.assert(parsed.thinking[0].includes('multiline'));
});

// Test 10: Handle malformed XML (no tags)
runner.test('Handle response without tags', (t) => {
  const response = 'Just plain text without any tags';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.say.length, 1);
  t.assertEqual(parsed.say[0], 'Just plain text without any tags');
  t.assert(parsed.hasValidTags); // Treated as implicit say
});

// Test 11: Handle empty response
runner.test('Handle empty response', (t) => {
  const response = '';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.thinking.length, 0);
  t.assertEqual(parsed.say.length, 0);
  t.assertEqual(parsed.functions.length, 0);
  t.assert(!parsed.hasValidTags);
});

// Test 12: Handle null/undefined response
runner.test('Handle null response', (t) => {
  const parsed = LLMParser.parse(null);

  t.assertEqual(parsed.thinking.length, 0);
  t.assertEqual(parsed.say.length, 0);
  t.assert(!parsed.hasValidTags);
});

// Test 13: Parse functions with JSON
runner.test('Parse functions with JSON', (t) => {
  const response = '<function>{"command": "/give", "params": {"item": "diamond"}}</function>';
  const parsed = LLMParser.parse(response);
  const funcs = LLMParser.parseFunctions(parsed.functions);

  t.assertEqual(funcs.length, 1);
  t.assertEqual(funcs[0].type, 'json');
  t.assertEqual(funcs[0].command.command, '/give');
});

// Test 14: Get primary say message
runner.test('Get primary say message', (t) => {
  const response = '<say>First message</say><say>Second message</say>';
  const parsed = LLMParser.parse(response);
  const primary = LLMParser.getPrimarySayMessage(parsed);

  t.assertEqual(primary, 'First message');
});

// Test 15: Get all say messages joined
runner.test('Get all say messages joined', (t) => {
  const response = '<say>Hello</say><say>World</say>';
  const parsed = LLMParser.parse(response);
  const all = LLMParser.getAllSayMessages(parsed, ' ');

  t.assertEqual(all, 'Hello World');
});

// Test 16: Has actionable content - with say
runner.test('Has actionable content - with say', (t) => {
  const response = '<say>Hello</say>';
  const parsed = LLMParser.parse(response);

  t.assert(LLMParser.hasActionableContent(parsed));
});

// Test 17: Has actionable content - with function
runner.test('Has actionable content - with function', (t) => {
  const response = '<function>/give @p diamond 1</function>';
  const parsed = LLMParser.parse(response);

  t.assert(LLMParser.hasActionableContent(parsed));
});

// Test 18: Has actionable content - with silence
runner.test('Has actionable content - with silence', (t) => {
  const response = '<silence/>';
  const parsed = LLMParser.parse(response);

  t.assert(LLMParser.hasActionableContent(parsed));
});

// Test 19: No actionable content
runner.test('No actionable content', (t) => {
  const response = '<thinking>Just thinking</thinking>';
  const parsed = LLMParser.parse(response);

  t.assert(!LLMParser.hasActionableContent(parsed));
});

// Test 20: Sanitize for Minecraft
runner.test('Sanitize for Minecraft', (t) => {
  const message = 'Hello\n\n\nWorld\x00\x01\x02';
  const sanitized = LLMParser.sanitizeForMinecraft(message);

  t.assert(!sanitized.includes('\x00'));
  t.assert(!sanitized.includes('\n\n\n'));
});

// Test 21: Sanitize long message (truncate)
runner.test('Sanitize long message', (t) => {
  const message = 'a'.repeat(500);
  const sanitized = LLMParser.sanitizeForMinecraft(message);

  t.assert(sanitized.length <= 256);
});

// Test 22: Format for logging
runner.test('Format for logging', (t) => {
  const response = '<thinking>Test</thinking><say>Hello</say><function>/test</function>';
  const parsed = LLMParser.parse(response);
  const formatted = LLMParser.formatForLogging(parsed);

  t.assert(formatted.includes('THINKING'));
  t.assert(formatted.includes('SAY'));
  t.assert(formatted.includes('FUNCTIONS'));
});

// Test 23: Case insensitive tags
runner.test('Parse case-insensitive tags', (t) => {
  const response = '<THINKING>Test</THINKING><SAY>Hello</SAY>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.thinking.length, 1);
  t.assertEqual(parsed.say.length, 1);
});

// Test 24: Whitespace handling
runner.test('Handle whitespace in tags', (t) => {
  const response = '<say>  Hello World  </say>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.say[0], 'Hello World');
});

// Test 25: Mixed valid and invalid tags
runner.test('Parse response with mixed tags', (t) => {
  const response = '<say>Valid</say><invalid>Invalid</invalid><say>Also valid</say>';
  const parsed = LLMParser.parse(response);

  t.assertEqual(parsed.say.length, 2);
  t.assertEqual(parsed.say[0], 'Valid');
  t.assertEqual(parsed.say[1], 'Also valid');
});

// Run all tests
if (import.meta.url === `file://${process.argv[1]}`) {
  runner.run().then(success => {
    process.exit(success ? 0 : 1);
  });
}

export default runner;
