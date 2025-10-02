# Craftbot MCP Setup Guide

This guide will walk you through setting up the complete Craftbot MCP system from scratch.

## Prerequisites

- Node.js 18+ and npm
- Git
- At least 8GB RAM recommended
- 10GB free disk space

## Table of Contents

1. [Install Minecraft Fabric Server](#1-install-minecraft-fabric-server)
2. [Configure RCON](#2-configure-rcon)
3. [Install Ollama](#3-install-ollama)
4. [Setup Craftbot MCP](#4-setup-craftbot-mcp)
5. [Start the System](#5-start-the-system)
6. [Verify Installation](#6-verify-installation)

---

## 1. Install Minecraft Fabric Server

### Download Fabric Server

1. Visit the [Fabric Server Download](https://fabricmc.net/use/server/) page
2. Download the latest installer for Minecraft 1.20.1 (or your preferred version)
3. Create a server directory:
   ```bash
   mkdir -p ~/minecraft-server
   cd ~/minecraft-server
   ```

### Run the Installer

```bash
# Download the installer
wget https://maven.fabricmc.net/net/fabricmc/fabric-installer/1.0.0/fabric-installer-1.0.0.jar

# Run the installer
java -jar fabric-installer-1.0.0.jar server -mcversion 1.20.1 -downloadMinecraft
```

### Accept EULA

```bash
# Edit eula.txt and set eula=true
echo "eula=true" > eula.txt
```

### Test the Server

```bash
# Start the server (first run will generate world)
java -Xmx4G -Xms1G -jar fabric-server-launch.jar nogui
```

Wait for the message "Done! For help, type help" then stop the server with `stop` command.

---

## 2. Configure RCON

RCON (Remote Console) allows the Craftbot MCP to send commands to your Minecraft server.

### Enable RCON in server.properties

Edit `~/minecraft-server/server.properties`:

```properties
# Enable RCON
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password_here

# Recommended settings
broadcast-rcon-to-ops=false
enable-command-block=true
```

**Important Security Notes:**
- Choose a strong RCON password
- Never commit your RCON password to version control
- Only bind RCON to localhost if running on the same machine
- Use `rcon.bind=127.0.0.1` to restrict RCON to local connections

### Verify RCON Configuration

After restarting your server, you can test RCON with:

```bash
# Install rcon-cli for testing (optional)
npm install -g rcon-cli

# Test connection
rcon -H localhost -p 25575 -P your_secure_password_here "list"
```

---

## 3. Install Ollama

Ollama is used to run local LLM models for AI entity responses.

### Install Ollama

**macOS/Linux:**
```bash
curl -fsSL https://ollama.com/install.sh | sh
```

**Windows:**
Download and run the installer from [ollama.com](https://ollama.com/download)

### Verify Installation

```bash
ollama --version
```

### Pull the llama2 Model

```bash
# Pull the default model (llama2, ~3.8GB)
ollama pull llama2

# Optional: Pull other models
ollama pull llama3.2    # Faster, smaller model
ollama pull mixtral     # More capable, larger model
```

### Test Ollama

```bash
# Start a chat to verify it works
ollama run llama2 "Hello, how are you?"
```

### Start Ollama Service

Ollama should start automatically, but you can manually start it:

**macOS/Linux:**
```bash
ollama serve
```

The Ollama API will be available at `http://localhost:11434`

---

## 4. Setup Craftbot MCP

### Clone the Repository

```bash
cd ~/Documents/Projects/mcp
git clone <repository-url> craftbot-mcp
cd craftbot-mcp
```

### Install Dependencies

```bash
npm install
```

### Configure Environment Variables

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` with your settings:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Minecraft Server RCON
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_secure_password_here

# Ollama Configuration
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_DEFAULT_MODEL=llama2

# Server Configuration
MCP_PORT=3000
LOG_LEVEL=info

# Minecraft Server Paths
MINECRAFT_LOG_PATH=/Users/your-username/minecraft-server/logs/latest.log

# Optional: ChromaDB for RAG (if using)
CHROMADB_URL=http://localhost:8000
```

**Important Configuration Notes:**
- Replace `your_secure_password_here` with your actual RCON password
- Update `MINECRAFT_LOG_PATH` to point to your actual Minecraft server logs
- Use absolute paths, not relative paths

### Verify Configuration

```bash
# Test that the config is valid
node -e "require('dotenv').config(); console.log('RCON Host:', process.env.RCON_HOST)"
```

---

## 5. Start the System

### Option A: Manual Start (for testing)

Open 3 separate terminal windows:

**Terminal 1 - Minecraft Server:**
```bash
cd ~/minecraft-server
java -Xmx4G -Xms1G -jar fabric-server-launch.jar nogui
```

**Terminal 2 - MCP Backend:**
```bash
cd ~/Documents/Projects/mcp/craftbot-mcp
npm run mock-server  # Or your actual MCP server when ready
```

**Terminal 3 - Frontend:**
```bash
cd ~/Documents/Projects/mcp/craftbot-mcp
npm run dev
```

### Option B: Automated Start (recommended)

Use the provided startup script:

```bash
cd ~/Documents/Projects/mcp/craftbot-mcp
chmod +x scripts/start-all.sh
./scripts/start-all.sh
```

The script will:
1. Check if Ollama is running (start if needed)
2. Start the MCP backend server
3. Start the frontend dev server
4. Display status of all services

### Access the Frontend

Open your browser to: `http://localhost:5173`

---

## 6. Verify Installation

### Check Service Status

**Ollama:**
```bash
curl http://localhost:11434/api/tags
```

**MCP Backend:**
```bash
curl http://localhost:3000/api/server/status
```

**Minecraft Server (RCON):**
```bash
rcon -H localhost -p 25575 -P your_password "list"
```

### Test End-to-End Flow

1. Join your Minecraft server
2. Send a chat message: `Hello [AI] bot`
3. Check the Craftbot frontend at `http://localhost:5173`
4. Verify logs appear in the Log Viewer
5. Check that the AI responds (if entity is enabled)

### Common Issues

#### RCON Connection Failed
- Verify RCON is enabled in `server.properties`
- Check password matches in `.env`
- Ensure Minecraft server is running
- Check firewall settings

#### Ollama Not Responding
- Verify Ollama service is running: `ollama list`
- Check logs: `journalctl -u ollama` (Linux)
- Restart Ollama: `ollama serve`

#### Frontend Can't Connect to Backend
- Verify backend is running on port 3000
- Check `VITE_API_URL` in `.env`
- Check browser console for CORS errors

#### No Logs Appearing
- Verify `MINECRAFT_LOG_PATH` points to the correct file
- Check file permissions
- Ensure Minecraft server is generating logs

---

## Next Steps

- Review the [Architecture Documentation](./architecture.md)
- Follow the [Testing Checklist](./testing-checklist.md)
- Run the [Test Scenarios](./test-scenarios.md)
- Configure AI entities in the frontend Config page

## Security Checklist

- [ ] RCON password is strong and unique
- [ ] `.env` file is in `.gitignore`
- [ ] RCON is bound to localhost only
- [ ] Firewall rules restrict MCP backend access
- [ ] File permissions on config files are restrictive
- [ ] Regular backups of world data are configured

---

## Support

If you encounter issues:
1. Check the logs in `craftbot.log`
2. Review the Minecraft server logs
3. Check the browser console for frontend errors
4. Verify all services are running
5. Consult the troubleshooting section in [architecture.md](./architecture.md)
