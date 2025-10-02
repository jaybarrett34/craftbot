#!/bin/bash
# Craftbot MCP - Minecraft Server Start Script

cd "$(dirname "$0")"

echo "Starting Minecraft Fabric server..."
java -Xms2G -Xmx4G -jar fabric-server-launch.jar nogui
