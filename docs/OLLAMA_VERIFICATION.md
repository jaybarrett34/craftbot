# Ollama Integration Verification Report

**Date:** October 1, 2025
**Model:** qwen2.5:14b-instruct
**Status:** Configured and Ready for Testing

---

## Executive Summary

The CraftBot-MCP project has been successfully configured to use the **qwen2.5:14b-instruct** model from Ollama. All configuration files, examples, and scripts have been updated. The system is ready for testing once the model is pulled and Ollama is running.

---

## Configuration Status

### 1. Ollama Client Integration

#### Server-side Client (`/server/ollama-client.js`)

**Status:** ✅ Verified and Updated

- **API Integration:** Uses Ollama's `/api/chat` and `/api/generate` endpoints
- **Model Configuration:** Default model set to `qwen2.5:14b-instruct`
- **Temperature:** Configurable (default 0.7)
- **Features:**
  - Non-streaming and streaming responses
  - Model listing and health checks
  - Model information retrieval
  - Timeout handling (60 seconds)
  - Error handling and retries

**Key Methods:**
```javascript
async chat(messages, options = {})
async generate(prompt, options = {})
async listModels()
async checkModelExists(modelName)
async getModelInfo(modelName)
async healthCheck()
```

**Configuration:**
```javascript
baseUrl: process.env.OLLAMA_URL || 'http://localhost:11434'
defaultModel: process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct'
timeout: 60000 // 60 seconds
```

#### Frontend Service Client (`/src/services/ollama-client.js`)

**Status:** ✅ Verified and Updated

- **System Prompt Generation:** Comprehensive XML tag instructions
- **Message Formatting:** Handles player/NPC messages with proximity
- **Conversation History:** Supports summarization
- **Context Awareness:** World state and perception radius

**XML Tag Instructions (Built-in):**
```
<thinking>your internal reasoning</thinking>
<say>your speech</say>
<function>minecraft command</function>
<silence/>
```

**System Prompt Features:**
- Character identity and personality
- World state capabilities
- Command permissions
- XML tag examples with proper usage
- Context-aware responses

---

### 2. Default Configuration

#### `/src/config/defaultConfig.js`

**Status:** ✅ Updated

```javascript
// Console Entity LLM Configuration
llm: {
  model: "qwen2.5:14b-instruct",
  enabled: false,
  temperature: 0.7
}

// Global Ollama Settings
ollama: {
  baseUrl: "http://localhost:11434",
  defaultModel: "qwen2.5:14b-instruct",
  timeout: 30000
}
```

---

### 3. Environment Configuration

#### `.env.example`

**Status:** ✅ Updated

```bash
# Ollama Configuration
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b-instruct
```

**Usage:**
1. Copy `.env.example` to `.env`
2. Customize if using different Ollama URL or model
3. Temperature defaults to 0.7 (configurable per entity)

---

### 4. Example Code

#### `/examples/llm-usage-example.js`

**Status:** ✅ Updated

- Merchant NPC (Villager Bob): `qwen2.5:14b-instruct` at temperature 0.7
- Guard NPC (Sir Reginald): `qwen2.5:14b-instruct` at temperature 0.6
- Integration manager configured with `qwen2.5:14b-instruct`

All example code now uses the new model and demonstrates proper XML tag usage.

---

### 5. Test Infrastructure

#### `/tests/integration-test.js`

**Status:** ✅ Updated

Default model fallback updated to `qwen2.5:14b-instruct` for all test scenarios.

#### `/scripts/preflight-check.sh`

**Status:** ✅ Updated

- Checks for `qwen2.5:14b-instruct` model
- Updated warning messages
- Recommends pulling `qwen2.5:14b-instruct` if not found

---

## New Scripts Created

### 1. Setup Script: `/scripts/setup-ollama.sh`

**Purpose:** Automated Ollama setup and model installation

**Features:**
- ✅ Checks if Ollama is installed
- ✅ Verifies Ollama service is running
- ✅ Lists currently installed models
- ✅ Pulls `qwen2.5:14b-instruct` if needed (8.5GB download)
- ✅ Shows model information
- ✅ Tests model with XML tag formatting
- ✅ Validates XML tag generation
- ✅ Provides setup summary and next steps

**Usage:**
```bash
chmod +x scripts/setup-ollama.sh
./scripts/setup-ollama.sh
```

**Environment Variable Support:**
```bash
OLLAMA_URL=http://localhost:11434 ./scripts/setup-ollama.sh
```

### 2. Test Script: `/scripts/test-ollama.js`

**Purpose:** Comprehensive testing of Ollama integration and XML tag generation

**Features:**
- ✅ Connection testing
- ✅ Model verification
- ✅ XML tag parsing and validation
- ✅ Multiple test scenarios:
  - Console entity greeting
  - Merchant NPC with command execution
  - Guard NPC with silence tag (distance-based)
  - Quest giver with multiple say tags
- ✅ Performance metrics (response time, tokens)
- ✅ Colored console output for readability

**Usage:**
```bash
node scripts/test-ollama.js
```

**Test Scenarios:**
1. **Basic Greeting:** Tests simple conversational response
2. **Item Transaction:** Tests function tag generation with Minecraft commands
3. **Silence Tag:** Tests distance-based non-response
4. **Multiple Say Tags:** Tests conversational flow with multiple outputs

### 3. Test Prompts: `/test-prompts.txt`

**Purpose:** Manual testing guide and prompt collection

**Contents:**
- Console entity prompts (5 scenarios)
- Merchant NPC prompts (5 scenarios)
- Guard NPC prompts with proximity (5 scenarios)
- Quest giver prompts (5 scenarios)
- XML tag generation tests (15 scenarios)
- Complex multi-step interactions (3 scenarios)
- Edge cases and error handling (5 scenarios)
- Performance tests (2 scenarios)
- Model behavior verification checklist

**Usage:**
Test individual prompts manually or use as reference for automated testing.

---

## System Prompt Analysis

### XML Tag Instructions Format

The system prompts in `/src/services/ollama-client.js` provide comprehensive XML tag guidance:

```
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
```

### Qwen2.5:14b-instruct Compatibility

**Model Specifications:**
- **Parameters:** ~14 billion
- **Size:** ~8.5GB
- **Context Length:** 32,768 tokens (32k context window)
- **Architecture:** Qwen2.5 (Alibaba Cloud)
- **Instruction Following:** Excellent
- **XML/Structured Output:** Very capable

**Expected Behavior:**
- ✅ Understands and follows XML tag instructions
- ✅ Maintains consistent tag formatting
- ✅ Generates valid Minecraft commands
- ✅ Provides logical internal reasoning
- ✅ Respects character personality and constraints

**Temperature Recommendations:**
- **0.3-0.5:** More consistent, predictable (good for guards, formal NPCs)
- **0.7:** Balanced creativity and consistency (recommended default)
- **0.8-1.0:** More creative, varied (good for quirky NPCs)

---

## Configuration Checklist

### Prerequisites

- [ ] **Ollama Installed**
  - macOS/Linux: `curl -fsSL https://ollama.ai/install.sh | sh`
  - Windows: Download from https://ollama.ai/download/windows

- [ ] **Ollama Service Running**
  ```bash
  ollama serve
  ```

- [ ] **Model Pulled**
  ```bash
  ollama pull qwen2.5:14b-instruct
  ```

### Configuration Steps

- [x] **Default Model Updated**
  - `src/config/defaultConfig.js` → `qwen2.5:14b-instruct`
  - `server/ollama-client.js` → `qwen2.5:14b-instruct`
  - `.env.example` → `qwen2.5:14b-instruct`

- [x] **Temperature Settings**
  - Console entity: 0.7
  - Default: 0.7 (configurable per entity)

- [x] **Examples Updated**
  - `examples/llm-usage-example.js` → All NPCs use `qwen2.5:14b-instruct`

- [x] **Test Infrastructure**
  - `tests/integration-test.js` → Updated
  - `scripts/preflight-check.sh` → Updated

- [x] **Scripts Created**
  - `scripts/setup-ollama.sh` → Executable
  - `scripts/test-ollama.js` → Executable
  - `test-prompts.txt` → Created

### Verification Steps

1. **Run Setup Script:**
   ```bash
   ./scripts/setup-ollama.sh
   ```

2. **Run Test Suite:**
   ```bash
   node scripts/test-ollama.js
   ```

3. **Manual Testing:**
   - Use prompts from `test-prompts.txt`
   - Test with: `ollama run qwen2.5:14b-instruct "Your prompt here"`

4. **Integration Testing:**
   - Start CraftBot server
   - Enable LLM for console entity
   - Send test messages
   - Verify XML tag parsing

---

## Model Behavior Expectations

### XML Tag Consistency

The qwen2.5:14b-instruct model should:

✅ **Always include `<thinking>` tags** for internal reasoning
✅ **Use `<say>` tags** for character dialogue
✅ **Generate `<function>` tags** with valid Minecraft commands
✅ **Use `<silence/>` appropriately** when not responding
✅ **Maintain proper tag nesting** and closing tags
✅ **Stay in character** based on system prompt

### Example Expected Response

**Input:**
```
[Player proximity: 5 blocks] <Steve> Hello! Can you give me a sword?
```

**Expected Output:**
```xml
<thinking>Steve is close by and asking for a sword. I'm a merchant, so I can help with that. I should be friendly and give him the item.</thinking>
<say>Hello Steve! Of course, I have just the thing for you.</say>
<say>Here's a fine diamond sword!</say>
<function>/give @p minecraft:diamond_sword 1</function>
```

### Debugging Poor XML Formatting

If the model produces inconsistent XML tags:

1. **Lower Temperature:** Try 0.5 instead of 0.7
2. **Add More Examples:** Include more few-shot examples in system prompt
3. **Use Conversation History:** Show previous good responses as examples
4. **Explicit Instructions:** Make XML requirements more explicit
5. **Post-processing:** Implement fallback XML parsing with error correction

---

## Known Issues and Limitations

### Model-Specific

- **XML Tag Variations:** Model might occasionally use variations like `<think>` instead of `<thinking>`
  - **Solution:** Implement fuzzy tag matching in parser

- **Command Syntax:** Model might generate invalid Minecraft commands
  - **Solution:** Validate commands before execution

- **Context Overflow:** Very long conversations might exceed context window
  - **Solution:** Implement conversation summarization (already supported)

### System-Specific

- **First Response Slow:** Model loading takes time on first request
  - **Expected:** 5-15 seconds for first response
  - **Subsequent:** 1-3 seconds per response

- **Memory Usage:** ~10GB RAM recommended for smooth operation

- **GPU Acceleration:** Metal (macOS), CUDA (NVIDIA), ROCm (AMD) recommended

---

## Performance Benchmarks

### Expected Response Times (M1/M2 Mac)

- **Simple Greeting:** 1-2 seconds
- **Command Execution:** 2-3 seconds
- **Complex Reasoning:** 3-5 seconds
- **First Load:** 10-15 seconds

### Token Generation

- **Average:** 30-50 tokens/second
- **Context Window:** 32,768 tokens
- **Max Output:** Configurable (default 500 tokens)

---

## Next Steps

### Immediate Actions

1. **Install Ollama:**
   ```bash
   curl -fsSL https://ollama.ai/install.sh | sh
   ```

2. **Start Ollama:**
   ```bash
   ollama serve
   ```

3. **Run Setup Script:**
   ```bash
   ./scripts/setup-ollama.sh
   ```

4. **Run Tests:**
   ```bash
   node scripts/test-ollama.js
   ```

### Testing Workflow

1. **Automated Testing:**
   - Run `test-ollama.js` to verify all scenarios
   - Check XML tag generation consistency
   - Validate command syntax

2. **Manual Testing:**
   - Use prompts from `test-prompts.txt`
   - Test edge cases
   - Verify character personality consistency

3. **Integration Testing:**
   - Enable LLM for console entity
   - Test with real Minecraft server
   - Monitor RCON command execution

### Configuration Tuning

1. **Temperature Adjustment:**
   - Start with 0.7 (current default)
   - Lower to 0.5 if responses too creative
   - Raise to 0.8 if responses too repetitive

2. **System Prompt Refinement:**
   - Add more examples if XML formatting inconsistent
   - Adjust personality descriptions for better character adherence
   - Include domain-specific knowledge (Minecraft mechanics)

3. **Token Limits:**
   - Default: 500 tokens (currently configured)
   - Increase for longer conversations
   - Decrease for faster responses

---

## Support and Troubleshooting

### Common Issues

**Issue:** "Ollama is not available"
**Solution:** Start Ollama with `ollama serve`

**Issue:** "Model not found"
**Solution:** Pull model with `ollama pull qwen2.5:14b-instruct`

**Issue:** "Response timeout"
**Solution:** Increase timeout in config or check system resources

**Issue:** "Inconsistent XML tags"
**Solution:** Lower temperature or add more examples to system prompt

### Resources

- **Ollama Documentation:** https://ollama.ai/docs
- **Qwen2.5 Model Card:** https://ollama.ai/library/qwen2.5
- **CraftBot Setup Guide:** `/SETUP_GUIDE.md`
- **Architecture Documentation:** `/SERVER_ARCHITECTURE.md`

---

## Summary

### Configuration Changes

| File | Status | Change |
|------|--------|--------|
| `src/config/defaultConfig.js` | ✅ Updated | Model: `qwen2.5:14b-instruct`, Temp: 0.7 |
| `server/ollama-client.js` | ✅ Updated | Default model: `qwen2.5:14b-instruct` |
| `.env.example` | ✅ Updated | Model: `qwen2.5:14b-instruct` |
| `examples/llm-usage-example.js` | ✅ Updated | All NPCs use `qwen2.5:14b-instruct` |
| `tests/integration-test.js` | ✅ Updated | Default: `qwen2.5:14b-instruct` |
| `scripts/preflight-check.sh` | ✅ Updated | References `qwen2.5:14b-instruct` |
| `scripts/setup-ollama.sh` | ✅ Created | Automated setup and verification |
| `scripts/test-ollama.js` | ✅ Created | Comprehensive test suite |
| `test-prompts.txt` | ✅ Created | Manual testing guide |

### System Status

- ✅ **Ollama Client:** Verified (supports any model)
- ✅ **Model Configuration:** Updated to `qwen2.5:14b-instruct`
- ✅ **Temperature:** Configurable (default 0.7)
- ✅ **System Prompts:** Include comprehensive XML tag instructions
- ✅ **Examples:** Updated with new model
- ✅ **Tests:** Updated with new model
- ✅ **Scripts:** Created for setup and testing
- ⏳ **Model Installed:** Pending user action (run `setup-ollama.sh`)

### Ready for Testing

The system is now configured and ready for testing with the **qwen2.5:14b-instruct** model. Run the setup script to install the model and verify the integration.

```bash
# Quick start
./scripts/setup-ollama.sh          # Install and verify model
node scripts/test-ollama.js         # Run test suite
cat test-prompts.txt                # View manual test prompts
```

---

**Report Generated:** October 1, 2025
**Configuration Version:** 1.0
**Model:** qwen2.5:14b-instruct
**Status:** ✅ Ready for Testing
