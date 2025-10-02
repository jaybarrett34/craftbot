#!/bin/bash
# Craftbot MCP - Minecraft Server Stop Script

SERVER_DIR="$(cd "$(dirname "$0")" && pwd)"

# Find the server process
PID=$(pgrep -f "fabric-server-launch.jar")

if [ -z "$PID" ]; then
    echo "Server is not running"
    exit 0
fi

echo "Stopping Minecraft server (PID: $PID)..."
kill $PID

# Wait for graceful shutdown
for i in {1..30}; do
    if ! ps -p $PID > /dev/null 2>&1; then
        echo "Server stopped successfully"
        exit 0
    fi
    sleep 1
done

# Force kill if still running
if ps -p $PID > /dev/null 2>&1; then
    echo "Force stopping server..."
    kill -9 $PID
fi

echo "Server stopped"
