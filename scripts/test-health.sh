#!/bin/bash

# Craftbot MCP Health Check Tester
# Tests all API endpoints and services for availability and latency

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

BOLD_GREEN='\033[1;32m'
BOLD_RED='\033[1;31m'
BOLD_CYAN='\033[1;36m'

# Default settings
VERBOSE=false
CONTINUOUS=false
INTERVAL=5

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -v|--verbose)
            VERBOSE=true
            shift
            ;;
        -c|--continuous)
            CONTINUOUS=true
            shift
            ;;
        -i|--interval)
            INTERVAL="$2"
            shift 2
            ;;
        -h|--help)
            echo "Craftbot MCP Health Check Tester"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -v, --verbose         Show detailed responses"
            echo "  -c, --continuous      Run continuously"
            echo "  -i, --interval N      Interval in seconds for continuous mode (default: 5)"
            echo "  -h, --help            Show this help message"
            echo ""
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use -h or --help for usage information"
            exit 1
            ;;
    esac
done

# Load environment
if [ -f ".env" ]; then
    export $(grep -v '^#' .env | xargs)
fi

SERVER_PORT=${SERVER_PORT:-3000}
BASE_URL="http://localhost:$SERVER_PORT"
OLLAMA_URL=${OLLAMA_URL:-http://localhost:11434}

# Status counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
FAILED_CHECKS=0

# Helper functions
print_header() {
    clear
    echo -e "${BOLD_CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD_CYAN}║       CRAFTBOT MCP - HEALTH CHECK TESTER              ║${NC}"
    echo -e "${BOLD_CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GRAY}Target: ${CYAN}$BASE_URL${GRAY} | Time: $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    echo ""
}

print_test() {
    echo -e "${BLUE}▸ Testing:${NC} $1"
}

print_success() {
    echo -e "${GREEN}  ✓${NC} $1"
    ((PASSED_CHECKS++))
}

print_failure() {
    echo -e "${RED}  ✗${NC} $1"
    ((FAILED_CHECKS++))
}

print_info() {
    echo -e "${GRAY}    $1${NC}"
}

print_latency() {
    local latency=$1
    local color=$GREEN

    if (( $(echo "$latency > 1000" | bc -l) )); then
        color=$RED
    elif (( $(echo "$latency > 500" | bc -l) )); then
        color=$YELLOW
    fi

    echo -e "${color}  ⏱  Latency: ${latency}ms${NC}"
}

# Measure request time
measure_request() {
    local url=$1
    local method=${2:-GET}
    local data=${3:-}

    local start=$(date +%s%N)

    if [ "$method" = "GET" ]; then
        response=$(curl -s -w "\n%{http_code}" -m 5 "$url" 2>/dev/null)
    else
        response=$(curl -s -w "\n%{http_code}" -m 5 -X "$method" -H "Content-Type: application/json" -d "$data" "$url" 2>/dev/null)
    fi

    local end=$(date +%s%N)
    local duration=$(( (end - start) / 1000000 ))

    http_code=$(echo "$response" | tail -n1)
    body=$(echo "$response" | head -n-1)

    echo "$duration|$http_code|$body"
}

# Test 1: Main health endpoint
test_health() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/health"

    result=$(measure_request "$BASE_URL/api/health")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)
    body=$(echo "$result" | cut -d'|' -f3)

    if [ "$http_code" = "200" ]; then
        print_success "Health endpoint responding"
        print_latency "$latency"

        if [ "$VERBOSE" = true ]; then
            print_info "Response: $body"
        fi

        # Parse response
        status=$(echo "$body" | jq -r '.status' 2>/dev/null)
        rcon=$(echo "$body" | jq -r '.rcon' 2>/dev/null)

        if [ "$status" = "ok" ]; then
            print_info "Status: OK"
        fi

        if [ "$rcon" = "true" ]; then
            print_info "RCON: Connected"
        elif [ "$rcon" = "false" ]; then
            print_info "RCON: Disconnected"
        fi
    else
        print_failure "Health endpoint failed (HTTP $http_code)"
    fi
}

# Test 2: Server status
test_server_status() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/server/status"

    result=$(measure_request "$BASE_URL/api/server/status")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)
    body=$(echo "$result" | cut -d'|' -f3)

    if [ "$http_code" = "200" ]; then
        print_success "Server status endpoint responding"
        print_latency "$latency"

        if [ "$VERBOSE" = true ]; then
            print_info "Response: $body"
        fi

        # Parse key metrics
        if command -v jq &> /dev/null; then
            entities=$(echo "$body" | jq -r '.entities' 2>/dev/null)
            print_info "Active entities: $entities"
        fi
    else
        print_failure "Server status failed (HTTP $http_code)"
    fi
}

# Test 3: Configuration endpoint
test_config() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/config"

    result=$(measure_request "$BASE_URL/api/config")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)

    if [ "$http_code" = "200" ]; then
        print_success "Config endpoint responding"
        print_latency "$latency"
    else
        print_failure "Config endpoint failed (HTTP $http_code)"
    fi
}

# Test 4: Entities endpoint
test_entities() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/entities"

    result=$(measure_request "$BASE_URL/api/entities")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)
    body=$(echo "$result" | cut -d'|' -f3)

    if [ "$http_code" = "200" ]; then
        print_success "Entities endpoint responding"
        print_latency "$latency"

        if command -v jq &> /dev/null; then
            count=$(echo "$body" | jq 'length' 2>/dev/null)
            print_info "Entity count: $count"
        fi
    else
        print_failure "Entities endpoint failed (HTTP $http_code)"
    fi
}

# Test 5: Logs endpoint
test_logs() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/logs"

    result=$(measure_request "$BASE_URL/api/logs?limit=10")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)

    if [ "$http_code" = "200" ]; then
        print_success "Logs endpoint responding"
        print_latency "$latency"
    else
        print_failure "Logs endpoint failed (HTTP $http_code)"
    fi
}

# Test 6: Ollama health
test_ollama() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/ollama/health"

    result=$(measure_request "$BASE_URL/api/ollama/health")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)
    body=$(echo "$result" | cut -d'|' -f3)

    if [ "$http_code" = "200" ]; then
        print_success "Ollama health endpoint responding"
        print_latency "$latency"

        if [ "$VERBOSE" = true ]; then
            print_info "Response: $body"
        fi

        # Check if Ollama is available
        available=$(echo "$body" | jq -r '.available' 2>/dev/null)
        if [ "$available" = "true" ]; then
            print_info "Ollama: Available"
        else
            print_info "Ollama: Not available"
        fi
    else
        print_failure "Ollama health check failed (HTTP $http_code)"
    fi
}

# Test 7: Ollama models
test_ollama_models() {
    ((TOTAL_CHECKS++))
    print_test "GET /api/ollama/models"

    result=$(measure_request "$BASE_URL/api/ollama/models")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)
    body=$(echo "$result" | cut -d'|' -f3)

    if [ "$http_code" = "200" ]; then
        print_success "Ollama models endpoint responding"
        print_latency "$latency"

        if command -v jq &> /dev/null; then
            models=$(echo "$body" | jq -r '.models[] | .name' 2>/dev/null)
            if [ -n "$models" ]; then
                print_info "Available models:"
                echo "$models" | while read -r model; do
                    print_info "  • $model"
                done
            fi
        fi
    else
        print_failure "Ollama models endpoint failed (HTTP $http_code)"
    fi
}

# Test 8: WebSocket connection
test_websocket() {
    ((TOTAL_CHECKS++))
    print_test "WebSocket Connection"

    # Try to connect using websocat if available
    if command -v websocat &> /dev/null; then
        timeout 3 websocat -n1 "ws://localhost:$SERVER_PORT" 2>/dev/null | head -n1 > /tmp/ws_test_$$ &
        WS_PID=$!

        sleep 2
        kill $WS_PID 2>/dev/null

        if [ -s /tmp/ws_test_$$ ]; then
            print_success "WebSocket connection successful"
            if [ "$VERBOSE" = true ]; then
                print_info "Response: $(cat /tmp/ws_test_$$)"
            fi
        else
            print_failure "WebSocket connection failed"
        fi

        rm -f /tmp/ws_test_$$
    else
        # Alternative: Check if port is open
        if timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$SERVER_PORT" 2>/dev/null; then
            print_success "WebSocket port is open"
            print_info "(Install 'websocat' for detailed WS testing)"
        else
            print_failure "WebSocket port not accessible"
        fi
    fi
}

# Test 9: Direct Ollama connection
test_ollama_direct() {
    ((TOTAL_CHECKS++))
    print_test "Direct Ollama Connection"

    result=$(measure_request "$OLLAMA_URL/api/tags")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)

    if [ "$http_code" = "200" ]; then
        print_success "Ollama service is accessible"
        print_latency "$latency"
    else
        print_failure "Ollama service not accessible (HTTP $http_code)"
        print_info "Make sure Ollama is running: ollama serve"
    fi
}

# Test 10: Command validation (POST)
test_command_validation() {
    ((TOTAL_CHECKS++))
    print_test "POST /api/commands/validate"

    data='{"command":"/time set day","entityId":"test-entity"}'
    result=$(measure_request "$BASE_URL/api/commands/validate" "POST" "$data")
    latency=$(echo "$result" | cut -d'|' -f1)
    http_code=$(echo "$result" | cut -d'|' -f2)

    # This might fail if entity doesn't exist, but that's okay - we're testing the endpoint
    if [ "$http_code" = "200" ] || [ "$http_code" = "404" ]; then
        print_success "Command validation endpoint responding"
        print_latency "$latency"
    else
        print_failure "Command validation failed (HTTP $http_code)"
    fi
}

# Print summary
print_summary() {
    echo ""
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo -e "${CYAN}                    SUMMARY                             ${NC}"
    echo -e "${CYAN}════════════════════════════════════════════════════════${NC}"
    echo ""

    echo -e "${BOLD_GREEN}Passed: $PASSED_CHECKS${NC}"
    echo -e "${BOLD_RED}Failed: $FAILED_CHECKS${NC}"
    echo -e "${GRAY}Total:  $TOTAL_CHECKS${NC}"

    if [ $TOTAL_CHECKS -gt 0 ]; then
        success_rate=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
        echo ""
        echo -e "${CYAN}Success Rate: ${success_rate}%${NC}"
    fi

    echo ""

    if [ $FAILED_CHECKS -eq 0 ]; then
        echo -e "${BOLD_GREEN}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BOLD_GREEN}║  ✓ ALL HEALTH CHECKS PASSED - SYSTEM HEALTHY ✓       ║${NC}"
        echo -e "${BOLD_GREEN}╚════════════════════════════════════════════════════════╝${NC}"
    elif [ $FAILED_CHECKS -le 2 ]; then
        echo -e "${YELLOW}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${YELLOW}║  ! MINOR ISSUES DETECTED - REVIEW FAILURES !          ║${NC}"
        echo -e "${YELLOW}╚════════════════════════════════════════════════════════╝${NC}"
    else
        echo -e "${BOLD_RED}╔════════════════════════════════════════════════════════╗${NC}"
        echo -e "${BOLD_RED}║  ✗ MULTIPLE FAILURES - SYSTEM UNHEALTHY ✗            ║${NC}"
        echo -e "${BOLD_RED}╚════════════════════════════════════════════════════════╝${NC}"
    fi

    echo ""
}

# Run all tests
run_tests() {
    # Reset counters
    TOTAL_CHECKS=0
    PASSED_CHECKS=0
    FAILED_CHECKS=0

    print_header

    test_health
    echo ""
    test_server_status
    echo ""
    test_config
    echo ""
    test_entities
    echo ""
    test_logs
    echo ""
    test_ollama
    echo ""
    test_ollama_models
    echo ""
    test_websocket
    echo ""
    test_ollama_direct
    echo ""
    test_command_validation

    print_summary
}

# Main execution
main() {
    # Check if server is running
    if ! timeout 1 bash -c "cat < /dev/null > /dev/tcp/localhost/$SERVER_PORT" 2>/dev/null; then
        echo -e "${BOLD_RED}Error: MCP Server not running on port $SERVER_PORT${NC}"
        echo -e "${GRAY}Start the server with: npm run server${NC}"
        exit 1
    fi

    if [ "$CONTINUOUS" = true ]; then
        echo -e "${CYAN}Running in continuous mode (every ${INTERVAL}s)...${NC}"
        echo -e "${GRAY}Press Ctrl+C to stop${NC}"
        echo ""

        while true; do
            run_tests
            echo -e "${GRAY}Waiting ${INTERVAL} seconds...${NC}"
            sleep "$INTERVAL"
        done
    else
        run_tests
    fi
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}Stopping health checks...${NC}"; exit 0' INT TERM

# Run main
main
