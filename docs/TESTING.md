# Craftbot MCP Testing Guide

Comprehensive testing and diagnostic tools for the Craftbot MCP system.

## Quick Start

```bash
# Before starting the system
npm run preflight          # Check all prerequisites

# After starting the system
npm run test:health        # Test all endpoints and services
npm run test:integration   # Run full integration test suite
npm run debug              # View live logs from all sources
```

---

## Available Test Scripts

### 1. Pre-Flight Check (`npm run preflight`)

**Purpose:** Verifies system is ready to run before starting any services.

**Checks:**
- ✓ Node.js version (18+)
- ✓ NPM dependencies installed
- ✓ Environment variables configured
- ✓ Ollama service running
- ✓ Required models available
- ✓ Minecraft server accessible (optional)
- ✓ RCON configuration
- ✓ Port availability
- ✓ File structure integrity
- ✓ Script permissions

**Usage:**
```bash
npm run preflight

# Or directly:
./scripts/preflight-check.sh
```

**Output:** Color-coded status report with pass/fail/warning indicators.

**When to use:**
- Before first-time setup
- After system updates
- When troubleshooting issues
- Before production deployment

---

### 2. Health Check (`npm run test:health`)

**Purpose:** Tests all API endpoints and services for availability and performance.

**Tests:**
1. GET /api/health - Main health endpoint
2. GET /api/server/status - Server status
3. GET /api/config - Configuration endpoint
4. GET /api/entities - Entity management
5. GET /api/logs - Log retrieval
6. GET /api/ollama/health - Ollama health
7. GET /api/ollama/models - Available models
8. WebSocket connection - Real-time communication
9. Direct Ollama connection - Service availability
10. POST /api/commands/validate - Command validation

**Usage:**
```bash
npm run test:health

# With options:
./scripts/test-health.sh --verbose          # Show detailed responses
./scripts/test-health.sh --continuous       # Run continuously
./scripts/test-health.sh -i 10              # Set interval (seconds)
```

**Output:**
- Latency for each endpoint (ms)
- HTTP status codes
- Success/failure indicators
- Overall health score

**When to use:**
- After starting the server
- To verify system health
- To diagnose performance issues
- For monitoring (continuous mode)

---

### 3. Integration Tests (`npm run test:integration`)

**Purpose:** Comprehensive end-to-end testing of all system components.

**Test Suite:**

#### Test 1: RCON Connection
- Connects to Minecraft RCON
- Sends test command (list)
- Verifies response
- Checks connection status

#### Test 2: Ollama Connection
- Health check
- Lists available models
- Tests chat completion with simple prompt
- Verifies response

#### Test 3: Chat Monitor
- Parses sample log line
- Verifies player/message extraction
- Tests event emission
- Checks history tracking

#### Test 4: Command Validator
- Tests valid whitelisted commands
- Tests non-whitelisted commands
- Tests permission level checks
- Lists allowed commands for entity

#### Test 5: State Fetcher
- Fetches world state via RCON
- Tests caching mechanism
- Verifies state parsing

#### Test 6: LLM Parser
- Tests tagged format parsing ([COMMAND:], [CHAT:])
- Tests implicit format parsing
- Tests text escaping for Minecraft JSON
- Verifies multiple response formats

#### Test 7: WebSocket
- Connects to WebSocket server
- Verifies connection confirmation
- Tests message sending/receiving
- Checks connection stability

#### Test 8: Full Flow (End-to-End)
- Simulates player chat message
- Builds LLM context
- Gets LLM response
- Parses response
- Validates commands
- Complete flow verification

**Usage:**
```bash
npm run test:integration

# Or:
node tests/integration-test.js
```

**Output:**
- Per-test pass/fail status
- Detailed error messages
- Test summary with pass rate
- Exit code 0 (success) or 1 (failure)

**Pass Criteria:**
- All critical tests pass
- At least 80% overall pass rate
- No fatal errors

**When to use:**
- After major code changes
- Before committing changes
- In CI/CD pipeline
- When troubleshooting complex issues

---

### 4. Debug Log Viewer (`npm run debug`)

**Purpose:** Real-time monitoring of logs from all system components.

**Features:**
- Multi-source log aggregation
- Color-coded by source (MCP, Minecraft, Vite)
- Syntax highlighting
- Log level filtering
- Timestamp display
- Command/player highlighting

**Usage:**
```bash
npm run debug

# With options:
./scripts/debug-logs.sh --level ERROR       # Show only errors
./scripts/debug-logs.sh --level WARN        # Show warnings and errors
./scripts/debug-logs.sh --no-timestamps     # Hide timestamps
./scripts/debug-logs.sh --no-follow -n 50   # Show last 50 lines
```

**Log Sources:**
- **[MCP]** - MCP Server (backend)
- **[MC]** - Minecraft Server (if configured)
- **[VITE]** - Frontend dev server

**Log Levels:**
- **ERROR** - Critical errors (red)
- **WARN** - Warnings (yellow)
- **INFO** - Information (green)
- **ALL** - Everything

**Keyboard Controls:**
- `Ctrl+C` - Exit

**When to use:**
- During development
- To debug issues in real-time
- To monitor chat activity
- To watch command execution

---

## Testing Workflow

### Initial Setup Testing

```bash
# 1. Verify system requirements
npm run preflight

# 2. Start the server
npm run server

# 3. In another terminal, test health
npm run test:health

# 4. Run full integration tests
npm run test:integration
```

### Development Testing

```bash
# Start with debug logging
npm run debug

# In another terminal:
npm run dev:full

# Make changes, then test:
npm run test:integration
```

### Continuous Monitoring

```bash
# Terminal 1: Run system
npm run dev:full

# Terminal 2: Watch logs
npm run debug

# Terminal 3: Continuous health checks
./scripts/test-health.sh --continuous -i 30
```

### Troubleshooting Workflow

```bash
# 1. Check system status
npm run test:health

# 2. Check pre-flight
npm run preflight

# 3. View logs
npm run debug

# 4. Run integration tests
npm run test:integration

# 5. See TROUBLESHOOTING.md for specific issues
```

---

## Test Coverage

### Components Tested

| Component | Integration Test | Health Check | Pre-Flight |
|-----------|-----------------|--------------|------------|
| RCON Client | ✓ | ✓ | ✓ |
| Ollama Client | ✓ | ✓ | ✓ |
| Chat Monitor | ✓ | - | ✓ |
| Command Validator | ✓ | ✓ | - |
| State Fetcher | ✓ | - | - |
| LLM Parser | ✓ | - | - |
| WebSocket Server | ✓ | ✓ | - |
| API Endpoints | - | ✓ | - |
| Configuration | - | ✓ | ✓ |
| File Structure | - | - | ✓ |
| Dependencies | - | - | ✓ |
| Ports | - | - | ✓ |

### Test Scenarios

**Positive Tests:**
- Valid RCON connection
- Successful LLM chat
- Command validation with proper permissions
- WebSocket communication
- State fetching

**Negative Tests:**
- Non-whitelisted commands
- Insufficient permission levels
- Connection failures (handled gracefully)

**Edge Cases:**
- Empty responses
- Malformed commands
- Concurrent requests
- Timeout scenarios

---

## Interpreting Test Results

### Pre-Flight Check

**All Green (✓):** System ready to run
- Proceed with starting the server

**Some Yellow (!):** Minor issues
- System may work with limited functionality
- Review warnings
- Non-critical services may be unavailable

**Any Red (✗):** Critical issues
- Do not start the system
- Fix errors before proceeding
- Check TROUBLESHOOTING.md

### Health Check

**All Tests Pass:** System healthy
- All endpoints responding
- Good latency (<500ms)

**Some Tests Fail:** Partial functionality
- Identify which services are down
- Check if optional or critical

**Latency Indicators:**
- Green (<500ms): Excellent
- Yellow (500-1000ms): Acceptable
- Red (>1000ms): Slow, investigate

### Integration Tests

**100% Pass:** Perfect
- All systems functional
- Ready for production

**80-99% Pass:** Good
- Minor issues or optional features failed
- Review failed tests

**<80% Pass:** Issues present
- Multiple system failures
- Debug before proceeding

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v2

    - name: Setup Node.js
      uses: actions/setup-node@v2
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm install

    - name: Pre-flight check
      run: npm run preflight

    - name: Run integration tests
      run: npm run test:integration
```

### Pre-commit Hook Example

```bash
#!/bin/bash
# .git/hooks/pre-commit

echo "Running pre-commit tests..."

# Run integration tests
npm run test:integration

if [ $? -ne 0 ]; then
    echo "Tests failed! Commit aborted."
    exit 1
fi

echo "Tests passed!"
exit 0
```

---

## Performance Benchmarks

### Expected Latency

| Endpoint | Good | Acceptable | Slow |
|----------|------|------------|------|
| /api/health | <50ms | <200ms | >200ms |
| /api/server/status | <100ms | <300ms | >300ms |
| /api/entities | <50ms | <200ms | >200ms |
| Ollama chat | <5s | <15s | >15s |
| RCON command | <100ms | <500ms | >500ms |
| WebSocket msg | <50ms | <200ms | >200ms |

### Expected Test Duration

| Test Suite | Duration |
|------------|----------|
| Pre-flight | 10-30s |
| Health Check | 5-10s |
| Integration Tests | 30-60s |

---

## Debugging Failed Tests

### Test 1-2 Fail (Connections)
→ Service not running or misconfigured
→ Check .env file
→ See TROUBLESHOOTING.md

### Test 3-6 Fail (Logic)
→ Code issue or missing data
→ Check logs with `npm run debug`
→ Verify file structure

### Test 7 Fails (WebSocket)
→ Port conflict or firewall
→ Check with `lsof -i :3000`
→ Verify WebSocket setup

### Test 8 Fails (Full Flow)
→ Multiple component issue
→ Run tests 1-7 individually
→ Fix root cause

---

## Best Practices

### Before Development
1. Run `npm run preflight`
2. Start with `npm run debug` in one terminal
3. Make changes
4. Test with `npm run test:integration`

### Before Committing
1. Run `npm run test:integration`
2. Ensure all tests pass
3. Check no console errors

### Before Deploying
1. Run `npm run preflight`
2. Run `npm run test:integration`
3. Run `npm run test:health`
4. Monitor with `npm run debug`

### During Production
1. Regular health checks (cron job)
2. Monitor logs
3. Set up alerts for failures

---

## Advanced Usage

### Custom Test Scenarios

You can extend the integration tests by adding to `/Users/bigballsinyourjaws/Documents/Projects/mcp/craftbot-mcp/tests/integration-test.js`:

```javascript
async function testCustomScenario() {
  logTest('Test 9: Custom Scenario');

  try {
    // Your test code here
    recordResult('Custom Scenario', true);
  } catch (error) {
    recordResult('Custom Scenario', false, error.message);
  }
}

// Add to runTests():
await testCustomScenario();
```

### Automated Health Monitoring

```bash
# Create a cron job:
*/5 * * * * cd /path/to/craftbot-mcp && npm run test:health >> health.log 2>&1

# Or use a monitoring tool to hit:
curl http://localhost:3000/api/health
```

---

## Related Documentation

- **TROUBLESHOOTING.md** - Detailed issue resolution
- **README.md** - Project overview and setup
- **SETUP_GUIDE.md** - Step-by-step setup instructions
- **SERVER_ARCHITECTURE.md** - System design and architecture

---

## Quick Reference

```bash
# Pre-flight check
npm run preflight

# Health check
npm run test:health

# Integration tests
npm run test:integration

# Debug logs
npm run debug

# All in one workflow:
npm run preflight && npm run server &
sleep 5 && npm run test:health && npm run test:integration
```

For troubleshooting, always start with:
```bash
npm run preflight
npm run test:health
```

Then consult **TROUBLESHOOTING.md** for specific issues.
