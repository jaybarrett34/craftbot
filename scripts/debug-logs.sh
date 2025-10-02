#!/bin/bash

# Craftbot MCP Debug Log Viewer
# Tails and color-codes logs from multiple sources simultaneously

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
GRAY='\033[0;90m'
NC='\033[0m' # No Color

# Bold variants
BOLD_RED='\033[1;31m'
BOLD_GREEN='\033[1;32m'
BOLD_YELLOW='\033[1;33m'
BOLD_CYAN='\033[1;36m'

# Default settings
LOG_LEVEL="INFO"
SHOW_TIMESTAMPS=true
FOLLOW_MODE=true
MAX_LINES=100

# Parse arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -l|--level)
            LOG_LEVEL="$2"
            shift 2
            ;;
        --no-timestamps)
            SHOW_TIMESTAMPS=false
            shift
            ;;
        --no-follow)
            FOLLOW_MODE=false
            shift
            ;;
        -n|--lines)
            MAX_LINES="$2"
            shift 2
            ;;
        -h|--help)
            echo "Craftbot MCP Debug Log Viewer"
            echo ""
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -l, --level LEVEL     Filter by log level (INFO, WARN, ERROR, ALL)"
            echo "  --no-timestamps       Hide timestamps"
            echo "  --no-follow          Don't follow log files (show last N lines)"
            echo "  -n, --lines N        Number of lines to show initially (default: 100)"
            echo "  -h, --help           Show this help message"
            echo ""
            echo "Log Sources:"
            echo "  - MCP Server (Node.js backend)"
            echo "  - Minecraft Server (if configured)"
            echo "  - Frontend (Vite dev server)"
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

# Print header
print_header() {
    clear
    echo -e "${BOLD_CYAN}╔════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD_CYAN}║       CRAFTBOT MCP - DEBUG LOG VIEWER                 ║${NC}"
    echo -e "${BOLD_CYAN}╚════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${GRAY}Filter Level: ${BOLD_YELLOW}$LOG_LEVEL${GRAY} | Follow: ${FOLLOW_MODE} | Timestamps: ${SHOW_TIMESTAMPS}${NC}"
    echo -e "${GRAY}Press Ctrl+C to exit${NC}"
    echo ""
    echo -e "${CYAN}Legend:${NC}"
    echo -e "  ${MAGENTA}[MCP]${NC}     = MCP Server"
    echo -e "  ${BLUE}[MC]${NC}      = Minecraft Server"
    echo -e "  ${GREEN}[VITE]${NC}    = Frontend Dev Server"
    echo -e "  ${BOLD_RED}[ERROR]${NC}   = Error messages"
    echo -e "  ${BOLD_YELLOW}[WARN]${NC}    = Warning messages"
    echo -e "  ${BOLD_GREEN}[INFO]${NC}    = Info messages"
    echo ""
    echo -e "${GRAY}════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Format timestamp
format_timestamp() {
    if [ "$SHOW_TIMESTAMPS" = true ]; then
        echo -e "${GRAY}[$(date '+%H:%M:%S')]${NC}"
    fi
}

# Color code by log level
color_by_level() {
    local line="$1"
    local colored="$line"

    # Highlight log levels
    if [[ "$line" =~ ERROR|error|Error|FAILED|failed|Failed ]]; then
        colored=$(echo "$colored" | sed -E "s/(ERROR|error|Error|FAILED|failed|Failed)/${BOLD_RED}\1${NC}/g")
    elif [[ "$line" =~ WARN|warn|Warn|WARNING|warning|Warning ]]; then
        colored=$(echo "$colored" | sed -E "s/(WARN|warn|Warn|WARNING|warning|Warning)/${BOLD_YELLOW}\1${NC}/g")
    elif [[ "$line" =~ INFO|info|Info ]]; then
        colored=$(echo "$colored" | sed -E "s/(INFO|info|Info)/${BOLD_GREEN}\1${NC}/g")
    fi

    # Highlight important events
    if [[ "$line" =~ connected|Connected|CONNECTED ]]; then
        colored=$(echo "$colored" | sed -E "s/(connected|Connected|CONNECTED)/${GREEN}\1${NC}/g")
    fi

    if [[ "$line" =~ disconnected|Disconnected|DISCONNECTED ]]; then
        colored=$(echo "$colored" | sed -E "s/(disconnected|Disconnected|DISCONNECTED)/${RED}\1${NC}/g")
    fi

    # Highlight commands
    if [[ "$line" =~ \/[a-zA-Z0-9_-]+ ]]; then
        colored=$(echo "$colored" | sed -E "s/(\/[a-zA-Z0-9_-]+)/${CYAN}\1${NC}/g")
    fi

    # Highlight player names in chat
    if [[ "$line" =~ \<[^>]+\> ]]; then
        colored=$(echo "$colored" | sed -E "s/(\<[^>]+\>)/${YELLOW}\1${NC}/g")
    fi

    echo -e "$colored"
}

# Filter by log level
should_show_line() {
    local line="$1"

    if [ "$LOG_LEVEL" = "ALL" ]; then
        return 0
    fi

    case "$LOG_LEVEL" in
        ERROR)
            [[ "$line" =~ ERROR|error|Error|FAILED|failed|Failed ]] && return 0
            return 1
            ;;
        WARN)
            [[ "$line" =~ ERROR|error|Error|FAILED|failed|Failed|WARN|warn|Warn|WARNING|warning|Warning ]] && return 0
            return 1
            ;;
        INFO)
            return 0
            ;;
        *)
            return 0
            ;;
    esac
}

# Process MCP Server logs
process_mcp_logs() {
    if [ "$FOLLOW_MODE" = true ]; then
        # In follow mode, we'll use the process output
        return
    fi
}

# Process Minecraft Server logs
process_mc_logs() {
    local MC_LOG="${MC_LOG_PATH:-./minecraft-server/logs/latest.log}"

    if [ ! -f "$MC_LOG" ]; then
        return
    fi

    if [ "$FOLLOW_MODE" = true ]; then
        tail -f -n "$MAX_LINES" "$MC_LOG" 2>/dev/null | while IFS= read -r line; do
            if should_show_line "$line"; then
                timestamp=$(format_timestamp)
                colored_line=$(color_by_level "$line")
                echo -e "${timestamp} ${BLUE}[MC]${NC} ${colored_line}"
            fi
        done &
    else
        tail -n "$MAX_LINES" "$MC_LOG" 2>/dev/null | while IFS= read -r line; do
            if should_show_line "$line"; then
                timestamp=$(format_timestamp)
                colored_line=$(color_by_level "$line")
                echo -e "${timestamp} ${BLUE}[MC]${NC} ${colored_line}"
            fi
        done
    fi
}

# Monitor MCP Server process
monitor_mcp() {
    if [ "$FOLLOW_MODE" = false ]; then
        return
    fi

    # Check if server is running
    SERVER_PORT=${SERVER_PORT:-3000}
    MCP_PID=$(lsof -ti:$SERVER_PORT 2>/dev/null)

    if [ -z "$MCP_PID" ]; then
        echo -e "${YELLOW}[!] MCP Server not running on port $SERVER_PORT${NC}"
        echo -e "${GRAY}    Start with: npm run server${NC}"
        return
    fi

    echo -e "${GREEN}[✓] MCP Server detected (PID: $MCP_PID)${NC}"

    # Monitor via API logs endpoint
    watch_api_logs &
}

# Watch API logs endpoint
watch_api_logs() {
    local API_URL="http://localhost:${SERVER_PORT:-3000}/api/logs"
    local LAST_COUNT=0

    while true; do
        LOGS=$(curl -s "$API_URL?limit=10" 2>/dev/null)

        if [ $? -eq 0 ] && [ -n "$LOGS" ]; then
            # Parse and display new logs
            echo "$LOGS" | jq -r '.[] | "\(.timestamp)|\(.type)|\(.message)"' 2>/dev/null | while IFS='|' read -r timestamp type message; do
                if should_show_line "$message"; then
                    local ts=""
                    if [ "$SHOW_TIMESTAMPS" = true ]; then
                        ts="${GRAY}[$(date -j -f "%Y-%m-%dT%H:%M:%S" "$timestamp" "+%H:%M:%S" 2>/dev/null || echo "TIME")]${NC}"
                    fi

                    local colored_msg=$(color_by_level "$message")

                    case "$type" in
                        error)
                            echo -e "${ts} ${MAGENTA}[MCP]${NC} ${BOLD_RED}[ERROR]${NC} ${colored_msg}"
                            ;;
                        warning)
                            echo -e "${ts} ${MAGENTA}[MCP]${NC} ${BOLD_YELLOW}[WARN]${NC} ${colored_msg}"
                            ;;
                        chat)
                            echo -e "${ts} ${MAGENTA}[MCP]${NC} ${CYAN}[CHAT]${NC} ${colored_msg}"
                            ;;
                        command)
                            echo -e "${ts} ${MAGENTA}[MCP]${NC} ${CYAN}[CMD]${NC} ${colored_msg}"
                            ;;
                        rcon)
                            echo -e "${ts} ${MAGENTA}[MCP]${NC} ${BLUE}[RCON]${NC} ${colored_msg}"
                            ;;
                        *)
                            echo -e "${ts} ${MAGENTA}[MCP]${NC} ${BOLD_GREEN}[INFO]${NC} ${colored_msg}"
                            ;;
                    esac
                fi
            done
        fi

        sleep 1
    done
}

# Monitor Vite dev server
monitor_vite() {
    if [ "$FOLLOW_MODE" = false ]; then
        return
    fi

    # Check if Vite is running (usually on port 5173)
    VITE_PORT=$(lsof -ti:5173 2>/dev/null)

    if [ -n "$VITE_PORT" ]; then
        echo -e "${GREEN}[✓] Vite dev server detected${NC}"
    fi
}

# Trap Ctrl+C
trap 'echo -e "\n${YELLOW}Stopping log viewer...${NC}"; kill $(jobs -p) 2>/dev/null; exit 0' INT TERM

# Main execution
main() {
    print_header

    # Check dependencies
    if ! command -v jq &> /dev/null; then
        echo -e "${YELLOW}[!] jq not found - log parsing will be limited${NC}"
        echo -e "${GRAY}    Install with: brew install jq (macOS) or apt-get install jq (Linux)${NC}"
        echo ""
    fi

    monitor_mcp
    monitor_vite
    process_mc_logs

    if [ "$FOLLOW_MODE" = true ]; then
        echo -e "${CYAN}[*] Watching logs... (Press Ctrl+C to stop)${NC}"
        echo ""

        # Wait for background processes
        wait
    else
        echo ""
        echo -e "${CYAN}[*] Showing last $MAX_LINES lines${NC}"
        echo -e "${GRAY}    Use without --no-follow to watch in real-time${NC}"
    fi
}

# Run main function
main
