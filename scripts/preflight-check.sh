#!/bin/bash

# Craftbot MCP Pre-Flight Check Script
# Verifies all system requirements before starting the server

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Status indicators
CHECK_PASS="${GREEN}✓${NC}"
CHECK_FAIL="${RED}✗${NC}"
CHECK_WARN="${YELLOW}!${NC}"
CHECK_INFO="${BLUE}ℹ${NC}"

# Counters
PASS_COUNT=0
FAIL_COUNT=0
WARN_COUNT=0

# Functions
print_header() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════════════════════╗"
    echo "║       CRAFTBOT MCP - PRE-FLIGHT CHECK                 ║"
    echo "╚════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
}

print_section() {
    echo -e "\n${BLUE}━━━ $1 ━━━${NC}"
}

check_pass() {
    echo -e "${CHECK_PASS} $1"
    ((PASS_COUNT++))
}

check_fail() {
    echo -e "${CHECK_FAIL} $1"
    ((FAIL_COUNT++))
}

check_warn() {
    echo -e "${CHECK_WARN} $1"
    ((WARN_COUNT++))
}

check_info() {
    echo -e "${CHECK_INFO} $1"
}

# Check 1: Node.js version
check_nodejs() {
    print_section "Node.js Environment"

    if ! command -v node &> /dev/null; then
        check_fail "Node.js not found"
        check_info "  Please install Node.js 18 or higher"
        return
    fi

    NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
    check_info "  Version: $(node -v)"

    if [ "$NODE_VERSION" -ge 18 ]; then
        check_pass "Node.js version is 18 or higher"
    else
        check_fail "Node.js version must be 18 or higher (current: $(node -v))"
        check_info "  Please upgrade Node.js"
    fi

    # Check npm
    if command -v npm &> /dev/null; then
        check_info "  npm version: $(npm -v)"
        check_pass "npm is installed"
    else
        check_fail "npm not found"
    fi
}

# Check 2: Dependencies
check_dependencies() {
    print_section "NPM Dependencies"

    if [ ! -d "node_modules" ]; then
        check_fail "node_modules directory not found"
        check_info "  Run: npm install"
        return
    fi

    check_pass "node_modules directory exists"

    # Check for key dependencies
    REQUIRED_DEPS=("express" "ws" "rcon-client" "dotenv" "cors")

    for dep in "${REQUIRED_DEPS[@]}"; do
        if [ -d "node_modules/$dep" ]; then
            check_pass "  $dep installed"
        else
            check_fail "  $dep not installed"
        fi
    done

    # Check package-lock.json
    if [ -f "package-lock.json" ]; then
        check_pass "package-lock.json exists"
    else
        check_warn "package-lock.json not found"
        check_info "  Consider running: npm install"
    fi
}

# Check 3: Environment Configuration
check_environment() {
    print_section "Environment Configuration"

    if [ ! -f ".env" ]; then
        check_fail ".env file not found"
        check_info "  Copy .env.example to .env and configure it"
        return
    fi

    check_pass ".env file exists"

    # Source .env file
    export $(grep -v '^#' .env | xargs)

    # Check required variables
    if [ -n "$SERVER_PORT" ]; then
        check_pass "  SERVER_PORT configured: $SERVER_PORT"
    else
        check_warn "  SERVER_PORT not set (will use default: 3000)"
    fi

    if [ -n "$RCON_HOST" ]; then
        check_pass "  RCON_HOST configured: $RCON_HOST"
    else
        check_warn "  RCON_HOST not set"
    fi

    if [ -n "$RCON_PORT" ]; then
        check_pass "  RCON_PORT configured: $RCON_PORT"
    else
        check_warn "  RCON_PORT not set (will use default: 25575)"
    fi

    if [ -n "$RCON_PASSWORD" ] && [ "$RCON_PASSWORD" != "your_password_here" ]; then
        check_pass "  RCON_PASSWORD configured"
    else
        check_fail "  RCON_PASSWORD not configured properly"
        check_info "    Set RCON_PASSWORD in .env file"
    fi

    if [ -n "$OLLAMA_URL" ]; then
        check_pass "  OLLAMA_URL configured: $OLLAMA_URL"
    else
        check_warn "  OLLAMA_URL not set (will use default: http://localhost:11434)"
    fi

    if [ -n "$OLLAMA_MODEL" ]; then
        check_pass "  OLLAMA_MODEL configured: $OLLAMA_MODEL"
    else
        check_warn "  OLLAMA_MODEL not set (will use default: qwen2.5:14b-instruct)"
    fi
}

# Check 4: Ollama Service
check_ollama() {
    print_section "Ollama Service"

    OLLAMA_URL=${OLLAMA_URL:-http://localhost:11434}

    check_info "  Checking $OLLAMA_URL..."

    if curl -s -f -m 5 "$OLLAMA_URL/api/tags" > /dev/null 2>&1; then
        check_pass "Ollama is running and accessible"

        # List available models
        MODELS=$(curl -s -f "$OLLAMA_URL/api/tags" | grep -o '"name":"[^"]*"' | cut -d'"' -f4)

        if [ -n "$MODELS" ]; then
            check_pass "Available models found:"
            echo "$MODELS" | while read -r model; do
                check_info "    - $model"
            done

            # Check if configured model exists
            if [ -n "$OLLAMA_MODEL" ]; then
                if echo "$MODELS" | grep -q "^$OLLAMA_MODEL$"; then
                    check_pass "  Configured model '$OLLAMA_MODEL' is available"
                else
                    check_fail "  Configured model '$OLLAMA_MODEL' not found"
                    check_info "    Available models: $(echo $MODELS | tr '\n' ', ')"
                    check_info "    Run: ollama pull $OLLAMA_MODEL"
                fi
            fi

            # Check for qwen2.5:14b-instruct specifically
            if echo "$MODELS" | grep -q "qwen2.5:14b-instruct"; then
                check_pass "  qwen2.5:14b-instruct is available"
            else
                check_warn "  qwen2.5:14b-instruct not found"
                check_info "    This is the recommended model for Craftbot"
                check_info "    Run: ollama pull qwen2.5:14b-instruct"
            fi
        else
            check_warn "No models found in Ollama"
            check_info "  Pull a model with: ollama pull qwen2.5:14b-instruct"
        fi
    else
        check_fail "Ollama is not accessible at $OLLAMA_URL"
        check_info "  Is Ollama running? Start it with: ollama serve"
    fi
}

# Check 5: Minecraft Server (optional)
check_minecraft() {
    print_section "Minecraft Server (Optional)"

    RCON_HOST=${RCON_HOST:-localhost}
    RCON_PORT=${RCON_PORT:-25575}

    check_info "  Checking RCON connection to $RCON_HOST:$RCON_PORT..."

    # Try to connect to RCON port
    if timeout 2 bash -c "cat < /dev/null > /dev/tcp/$RCON_HOST/$RCON_PORT" 2>/dev/null; then
        check_pass "RCON port is accessible"
    else
        check_warn "RCON port not accessible"
        check_info "  This is optional - server will work without Minecraft connection"
        check_info "  To enable: Start Minecraft server with RCON enabled"
    fi

    # Check log file path
    if [ -n "$MC_LOG_PATH" ]; then
        if [ -f "$MC_LOG_PATH" ]; then
            check_pass "  Minecraft log file found: $MC_LOG_PATH"
        else
            check_warn "  Minecraft log file not found: $MC_LOG_PATH"
            check_info "    Update MC_LOG_PATH in .env to point to your server's latest.log"
        fi
    else
        check_warn "  MC_LOG_PATH not configured"
        check_info "    Set this to enable real-time chat monitoring"
    fi
}

# Check 6: Port Availability
check_ports() {
    print_section "Port Availability"

    SERVER_PORT=${SERVER_PORT:-3000}

    check_info "  Checking port $SERVER_PORT..."

    if lsof -Pi :$SERVER_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
        check_warn "Port $SERVER_PORT is already in use"
        PROCESS=$(lsof -Pi :$SERVER_PORT -sTCP:LISTEN | tail -n 1)
        check_info "    Process: $PROCESS"
        check_info "    Stop the process or change SERVER_PORT in .env"
    else
        check_pass "Port $SERVER_PORT is available"
    fi
}

# Check 7: File Structure
check_file_structure() {
    print_section "File Structure"

    REQUIRED_DIRS=("server" "src" "tests" "scripts" "data")

    for dir in "${REQUIRED_DIRS[@]}"; do
        if [ -d "$dir" ]; then
            check_pass "  $dir/ exists"
        else
            check_fail "  $dir/ not found"
        fi
    done

    REQUIRED_FILES=(
        "server/mcp-server.js"
        "server/rcon-client.js"
        "server/ollama-client.js"
        "server/chat-monitor.js"
        "server/command-validator.js"
        "server/llm-parser.js"
        "package.json"
        "vite.config.js"
    )

    for file in "${REQUIRED_FILES[@]}"; do
        if [ -f "$file" ]; then
            check_pass "  $file exists"
        else
            check_fail "  $file not found"
        fi
    done

    # Check for minecraft-commands.csv in multiple locations
    if [ -f "data/minecraft-commands.csv" ] || [ -f "minecraft-commands.csv" ]; then
        check_pass "  minecraft-commands.csv found"
    else
        check_warn "  minecraft-commands.csv not found"
        check_info "    This file is needed for command validation"
    fi
}

# Check 8: Permissions
check_permissions() {
    print_section "File Permissions"

    # Check if scripts are executable
    SCRIPTS=("scripts/start-all.sh" "scripts/preflight-check.sh")

    for script in "${SCRIPTS[@]}"; do
        if [ -f "$script" ]; then
            if [ -x "$script" ]; then
                check_pass "  $script is executable"
            else
                check_warn "  $script is not executable"
                check_info "    Run: chmod +x $script"
            fi
        fi
    done
}

# Print summary
print_summary() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                    SUMMARY                             ${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"

    echo -e "\n${GREEN}Passed:  $PASS_COUNT${NC}"
    echo -e "${RED}Failed:  $FAIL_COUNT${NC}"
    echo -e "${YELLOW}Warnings: $WARN_COUNT${NC}"

    echo ""

    if [ $FAIL_COUNT -eq 0 ]; then
        echo -e "${GREEN}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${GREEN}║  ✓ PRE-FLIGHT CHECK PASSED - READY FOR TAKEOFF! ✓    ║${NC}"
        echo -e "${GREEN}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${CYAN}You can now start the server with:${NC}"
        echo -e "${BLUE}  npm run dev:full${NC} (frontend + backend)"
        echo -e "${BLUE}  npm run server${NC} (backend only)"
        echo ""
        return 0
    elif [ $FAIL_COUNT -le 3 ] && [ $WARN_COUNT -le 5 ]; then
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ! MINOR ISSUES DETECTED - REVIEW WARNINGS !          ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${YELLOW}The server may work, but some features might be limited.${NC}"
        echo -e "${YELLOW}Review the warnings above before proceeding.${NC}"
        echo ""
        return 1
    else
        echo -e "${RED}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${RED}║  ✗ PRE-FLIGHT CHECK FAILED - DO NOT LAUNCH ✗          ║${NC}"
        echo -e "${RED}╚════════════════════════════════════════════════════════╝${NC}"
        echo ""
        echo -e "${RED}Critical issues detected. Please fix the errors above.${NC}"
        echo ""
        return 2
    fi
}

# Main execution
main() {
    print_header

    check_nodejs
    check_dependencies
    check_environment
    check_ollama
    check_minecraft
    check_ports
    check_file_structure
    check_permissions

    print_summary
    exit $?
}

# Run main function
main
