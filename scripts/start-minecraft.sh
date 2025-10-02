#!/bin/bash

# Craftbot MCP - Minecraft Server Start Script
# Convenience wrapper for starting the Minecraft server with proper monitoring

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT/minecraft-server"
ENV_FILE="$PROJECT_ROOT/.env"

# Functions
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_server_installed() {
    if [ ! -d "$SERVER_DIR" ]; then
        print_error "Minecraft server not found at $SERVER_DIR"
        echo ""
        echo "Please run the setup script first:"
        echo "  ./scripts/setup-minecraft-server.sh"
        echo ""
        exit 1
    fi

    if [ ! -f "$SERVER_DIR/fabric-server-launch.jar" ]; then
        print_error "Fabric server jar not found"
        echo ""
        echo "Please run the setup script first:"
        echo "  ./scripts/setup-minecraft-server.sh"
        echo ""
        exit 1
    fi
}

check_server_running() {
    if pgrep -f "fabric-server-launch.jar" > /dev/null; then
        print_warning "Minecraft server is already running!"
        echo ""
        echo "To stop it, run:"
        echo "  ./scripts/stop-minecraft.sh"
        echo "  or"
        echo "  cd minecraft-server && ./stop-server.sh"
        echo ""
        exit 1
    fi
}

check_java() {
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed!"
        echo "Please install Java 17 or higher"
        exit 1
    fi
}

load_env() {
    if [ -f "$ENV_FILE" ]; then
        source "$ENV_FILE"
        print_info "Loaded environment variables from .env"
    else
        print_warning ".env file not found, using defaults"
        RCON_HOST="localhost"
        RCON_PORT="25575"
        RCON_PASSWORD="craftbot_rcon_pass"
    fi
}

show_connection_info() {
    echo ""
    echo "============================================"
    echo "  Minecraft Server Connection Info"
    echo "============================================"
    echo ""
    echo "Game Connection:"
    echo "  - Address: localhost:25565"
    echo "  - Version: 1.20.1 (Fabric)"
    echo ""
    echo "RCON Connection:"
    echo "  - Host: ${RCON_HOST:-localhost}"
    echo "  - Port: ${RCON_PORT:-25575}"
    echo "  - Password: ${RCON_PASSWORD:-craftbot_rcon_pass}"
    echo ""
    echo "Server Location:"
    echo "  - Directory: $SERVER_DIR"
    echo "  - Logs: $SERVER_DIR/logs/latest.log"
    echo ""
    echo "============================================"
    echo ""
}

start_server() {
    print_info "Starting Minecraft server..."
    echo ""

    cd "$SERVER_DIR"

    # Start server in background
    java -Xms2G -Xmx4G -jar fabric-server-launch.jar nogui > server-console.log 2>&1 &
    SERVER_PID=$!

    echo $SERVER_PID > server.pid
    print_success "Server started with PID: $SERVER_PID"

    # Wait a moment for startup
    sleep 3

    # Check if server is still running
    if ! ps -p $SERVER_PID > /dev/null 2>&1; then
        print_error "Server failed to start!"
        echo ""
        echo "Check the logs for errors:"
        echo "  tail -f $SERVER_DIR/logs/latest.log"
        echo "  or"
        echo "  cat $SERVER_DIR/server-console.log"
        exit 1
    fi

    print_info "Server is starting up..."
    echo ""
    echo "Tailing server logs (press Ctrl+C to stop watching, server will keep running):"
    echo "----------------------------------------"
    echo ""

    # Tail the latest log file
    tail -f logs/latest.log 2>/dev/null || tail -f server-console.log
}

# Main execution
main() {
    echo ""
    echo "============================================"
    echo "  Craftbot MCP - Start Minecraft Server"
    echo "============================================"
    echo ""

    check_java
    check_server_installed
    check_server_running
    load_env
    show_connection_info

    echo "Starting server..."
    echo ""
    echo "Tips:"
    echo "  - Press Ctrl+C to stop watching logs (server continues)"
    echo "  - To stop server: ./scripts/stop-minecraft.sh"
    echo "  - To connect: Open Minecraft 1.20.1 and connect to 'localhost'"
    echo "  - Test commands: See minecraft-server/test-npcs.txt"
    echo ""
    echo "Press Enter to start..."
    read -r

    start_server
}

# Trap Ctrl+C to inform user
trap ctrl_c INT

ctrl_c() {
    echo ""
    echo ""
    print_info "Stopped watching logs. Server is still running in background."
    echo ""
    echo "To stop the server:"
    echo "  ./scripts/stop-minecraft.sh"
    echo ""
    echo "To watch logs again:"
    echo "  tail -f $SERVER_DIR/logs/latest.log"
    echo ""
    exit 0
}

# Run main function
main
