#!/bin/bash

# Craftbot MCP - Minecraft Server Stop Script
# Convenience wrapper for stopping the Minecraft server

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

# Main execution
echo ""
echo "============================================"
echo "  Craftbot MCP - Stop Minecraft Server"
echo "============================================"
echo ""

# Find the server process
PID=$(pgrep -f "fabric-server-launch.jar")

if [ -z "$PID" ]; then
    print_warning "Minecraft server is not running"
    exit 0
fi

print_info "Found Minecraft server process (PID: $PID)"
print_info "Sending shutdown signal..."

# Try graceful shutdown first
kill $PID

# Wait for graceful shutdown
echo -n "Waiting for server to stop"
for i in {1..30}; do
    if ! ps -p $PID > /dev/null 2>&1; then
        echo ""
        print_success "Server stopped successfully"

        # Clean up PID file if it exists
        if [ -f "$SERVER_DIR/server.pid" ]; then
            rm "$SERVER_DIR/server.pid"
        fi

        exit 0
    fi
    echo -n "."
    sleep 1
done
echo ""

# Force kill if still running
if ps -p $PID > /dev/null 2>&1; then
    print_warning "Server did not stop gracefully, forcing shutdown..."
    kill -9 $PID
    sleep 1

    if ! ps -p $PID > /dev/null 2>&1; then
        print_success "Server force stopped"

        # Clean up PID file if it exists
        if [ -f "$SERVER_DIR/server.pid" ]; then
            rm "$SERVER_DIR/server.pid"
        fi
    else
        print_error "Failed to stop server"
        exit 1
    fi
fi

echo ""
