# Installation Guide - CraftBot MCP

Complete installation guide for macOS, Linux, and Windows. Follow the instructions for your operating system.

## Table of Contents

- [Prerequisites](#prerequisites)
- [macOS Installation](#macos-installation)
- [Linux Installation](#linux-installation)
- [Windows Installation](#windows-installation)
- [AWS EC2 Deployment](#aws-ec2-deployment)
- [Verification](#verification)
- [Next Steps](#next-steps)

---

## Prerequisites

All platforms require the following software:

### 1. Node.js 18+
**Purpose:** JavaScript runtime for the MCP server and frontend

**Check if installed:**
```bash
node --version
npm --version
```

**Install:**
- **macOS:**
  ```bash
  brew install node
  # OR download from https://nodejs.org
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
  sudo apt-get install -y nodejs
  ```
- **Linux (Fedora/RHEL):**
  ```bash
  sudo dnf install nodejs npm
  ```
- **Windows:**
  - Download installer from https://nodejs.org
  - Run the installer and follow prompts
  - Restart terminal after installation

### 2. Java 17+
**Purpose:** Required to run the Minecraft Fabric server

**Check if installed:**
```bash
java -version
```

**Install:**
- **macOS:**
  ```bash
  brew install openjdk@17
  # Add to PATH
  echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
  source ~/.zshrc
  ```
- **Linux (Ubuntu/Debian):**
  ```bash
  sudo apt update
  sudo apt install openjdk-17-jdk
  ```
- **Linux (Fedora/RHEL):**
  ```bash
  sudo dnf install java-17-openjdk java-17-openjdk-devel
  ```
- **Windows:**
  - Download from https://adoptium.net/
  - Run installer and ensure "Set JAVA_HOME" is checked
  - Restart terminal after installation

### 3. Ollama
**Purpose:** Local LLM inference for AI-powered NPCs

**Check if installed:**
```bash
ollama --version
```

**Install:**
- **macOS:**
  ```bash
  curl -fsSL https://ollama.ai/install.sh | sh
  # OR use Homebrew
  brew install ollama
  ```
- **Linux:**
  ```bash
  curl -fsSL https://ollama.ai/install.sh | sh
  ```
- **Windows:**
  - Download installer from https://ollama.ai/download/windows
  - Run the installer
  - Restart terminal after installation

**Important:** Installation script does NOT start Ollama automatically. You must start it manually (see below).

### 4. Minecraft Java Edition 1.20.1+
**Purpose:** Client to connect to the Minecraft server

- Download from https://minecraft.net
- Bedrock Edition will NOT work - must be Java Edition

---

## macOS Installation

### Step 1: Install Prerequisites
```bash
# Install Homebrew if not installed
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install dependencies
brew install node openjdk@17 ollama

# Configure Java PATH
echo 'export PATH="/opt/homebrew/opt/openjdk@17/bin:$PATH"' >> ~/.zshrc
source ~/.zshrc
```

### Step 2: Clone and Setup Project
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/craftbot-mcp.git
cd craftbot-mcp

# Install Node dependencies
npm install

# Create environment file
cp .env.example .env
nano .env  # Edit with your preferred editor
```

### Step 3: Configure Environment
Edit `.env` file:
```bash
# Frontend
VITE_API_URL=http://localhost:3000/api

# Backend
SERVER_PORT=3000

# Minecraft RCON
RCON_HOST=localhost
RCON_PORT=25575
RCON_PASSWORD=your_secure_password_here  # CHANGE THIS!

# Ollama
OLLAMA_URL=http://localhost:11434
OLLAMA_MODEL=qwen2.5:14b-instruct

# Minecraft Server
MC_LOG_PATH=./minecraft-server/logs/latest.log
```

### Step 4: Setup Minecraft Server
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run Minecraft server setup (automatic)
./scripts/setup-minecraft-server.sh
```

This will:
- Download Fabric installer
- Install Minecraft server 1.21.9
- Download Fabric API
- Configure RCON
- Accept EULA
- Create start/stop scripts

### Step 5: Setup Ollama
```bash
# Run Ollama setup script
./scripts/setup-ollama.sh
```

This will:
- Verify Ollama is installed
- Pull the qwen2.5:14b-instruct model (~8.5GB)
- Test the model

**Note:** This does NOT install Ollama, only configures it. You must install Ollama first.

### Step 6: Start Services

Open **3 separate terminal windows:**

**Terminal 1 - Ollama:**
```bash
ollama serve
```

**Terminal 2 - Minecraft Server:**
```bash
cd craftbot-mcp
./scripts/start-minecraft.sh
# OR
cd minecraft-server
./start-server.sh
```

**Terminal 3 - MCP Server:**
```bash
cd craftbot-mcp
npm run dev:full
```

---

## Linux Installation

### Step 1: Install Prerequisites (Ubuntu/Debian)
```bash
# Update package manager
sudo apt update && sudo apt upgrade -y

# Install Node.js 18+
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 17
sudo apt install openjdk-17-jdk -y

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install git and other tools
sudo apt install git curl wget -y
```

### Step 1: Install Prerequisites (Fedora/RHEL)
```bash
# Update package manager
sudo dnf update -y

# Install Node.js
sudo dnf install nodejs npm -y

# Install Java 17
sudo dnf install java-17-openjdk java-17-openjdk-devel -y

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install git and other tools
sudo dnf install git curl wget -y
```

### Step 2: Clone and Setup Project
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/craftbot-mcp.git
cd craftbot-mcp

# Install Node dependencies
npm install

# Create environment file
cp .env.example .env
nano .env  # Edit configuration
```

### Step 3: Configure Environment
Edit `.env` (see macOS Step 3 for configuration)

### Step 4: Setup Minecraft Server
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Run setup
./scripts/setup-minecraft-server.sh
```

### Step 5: Setup Ollama
```bash
./scripts/setup-ollama.sh
```

### Step 6: Start Services

Open **3 separate terminal windows or use tmux:**

**Using separate terminals:**
```bash
# Terminal 1
ollama serve

# Terminal 2
cd craftbot-mcp && ./scripts/start-minecraft.sh

# Terminal 3
cd craftbot-mcp && npm run dev:full
```

**Using tmux (recommended for servers):**
```bash
# Install tmux
sudo apt install tmux -y  # Ubuntu/Debian
sudo dnf install tmux -y  # Fedora/RHEL

# Create session with 3 panes
tmux new-session -d -s craftbot
tmux split-window -h
tmux split-window -v

# Run services
tmux send-keys -t craftbot:0.0 'ollama serve' C-m
tmux send-keys -t craftbot:0.1 'cd craftbot-mcp && ./scripts/start-minecraft.sh' C-m
tmux send-keys -t craftbot:0.2 'cd craftbot-mcp && npm run dev:full' C-m

# Attach to session
tmux attach -t craftbot
```

---

## Windows Installation

### Step 1: Install Prerequisites

**1. Install Node.js:**
- Download from https://nodejs.org (LTS version recommended)
- Run installer, click "Next" through all prompts
- Ensure "Add to PATH" is checked
- Restart PowerShell/Command Prompt after installation

**2. Install Java 17:**
- Download from https://adoptium.net/
- Run installer
- Check "Set JAVA_HOME variable"
- Check "Add to PATH"
- Restart PowerShell/Command Prompt

**3. Install Ollama:**
- Download from https://ollama.ai/download/windows
- Run installer
- Restart PowerShell/Command Prompt

**4. Install Git (if not installed):**
- Download from https://git-scm.com/download/win
- Run installer with default options

### Step 2: Clone and Setup Project

Open PowerShell as Administrator:
```powershell
# Clone repository
git clone https://github.com/YOUR_USERNAME/craftbot-mcp.git
cd craftbot-mcp

# Install Node dependencies
npm install

# Create environment file
copy .env.example .env
notepad .env  # Edit configuration
```

### Step 3: Configure Environment
Edit `.env` in Notepad (see macOS Step 3 for configuration)

**Important Windows-specific paths:**
```bash
# Use forward slashes or double backslashes
MC_LOG_PATH=./minecraft-server/logs/latest.log
# OR
MC_LOG_PATH=.\\minecraft-server\\logs\\latest.log
```

### Step 4: Setup Minecraft Server

**Option A: Use Git Bash (recommended):**
```bash
# Open Git Bash
cd craftbot-mcp
bash ./scripts/setup-minecraft-server.sh
```

**Option B: Manual setup for PowerShell:**
1. Download Fabric installer from https://fabricmc.net/use/installer/
2. Run: `java -jar fabric-installer.jar server`
3. Accept EULA: `echo eula=true > minecraft-server/eula.txt`
4. Configure RCON in `minecraft-server/server.properties`:
   ```properties
   enable-rcon=true
   rcon.port=25575
   rcon.password=your_secure_password
   ```

### Step 5: Setup Ollama

**In PowerShell:**
```powershell
# Start Ollama service (if not running)
ollama serve

# In new PowerShell window, pull model
ollama pull qwen2.5:14b-instruct

# Test model
ollama run qwen2.5:14b-instruct "Hello, who are you?"
```

### Step 6: Start Services

Open **3 separate PowerShell/Command Prompt windows:**

**Window 1 - Ollama:**
```powershell
ollama serve
```

**Window 2 - Minecraft Server:**
```powershell
cd craftbot-mcp\minecraft-server
java -Xms2G -Xmx4G -jar fabric-server-launch.jar nogui
```

**Window 3 - MCP Server:**
```powershell
cd craftbot-mcp
npm run dev:full
```

---

## AWS EC2 Deployment

Deploy CraftBot MCP to AWS EC2 for 24/7 uptime and remote access.

### Prerequisites
- AWS Account
- EC2 instance (t3.medium or larger recommended)
- Ubuntu 20.04+ AMI
- SSH key pair configured

### Step 1: Launch EC2 Instance

**Instance specifications:**
- **Type:** t3.medium (2 vCPU, 4GB RAM minimum)
- **AMI:** Ubuntu Server 20.04 LTS
- **Storage:** 30GB GP3 SSD minimum
- **Security Group:** Allow ports 22 (SSH), 25565 (Minecraft), 3000 (MCP), 5173 (Frontend)

**Security Group Rules:**
```
Type            Protocol    Port Range    Source
SSH             TCP         22            My IP
Custom TCP      TCP         25565         0.0.0.0/0
Custom TCP      TCP         3000          0.0.0.0/0
Custom TCP      TCP         5173          0.0.0.0/0
Custom TCP      TCP         11434         127.0.0.1/32
```

### Step 2: Connect to EC2
```bash
# From your local machine
ssh -i your-key.pem ubuntu@your-ec2-ip
```

### Step 3: Install Dependencies
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install Java 17
sudo apt install openjdk-17-jdk -y

# Install Ollama
curl -fsSL https://ollama.ai/install.sh | sh

# Install tmux for session management
sudo apt install tmux git -y
```

### Step 4: Clone and Configure Project
```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/craftbot-mcp.git
cd craftbot-mcp

# Install dependencies
npm install

# Configure environment
cp .env.example .env
nano .env
```

**EC2-specific .env configuration:**
```bash
# Update URLs for EC2 public IP
VITE_API_URL=http://YOUR_EC2_PUBLIC_IP:3000/api

# Use public IP for external access
RCON_HOST=localhost  # Keep as localhost
OLLAMA_URL=http://localhost:11434  # Keep as localhost
```

### Step 5: Setup Servers
```bash
# Make scripts executable
chmod +x scripts/*.sh

# Setup Minecraft server
./scripts/setup-minecraft-server.sh

# Setup Ollama
./scripts/setup-ollama.sh
```

### Step 6: Create systemd Services (Production)

**Create Ollama service:**
```bash
sudo nano /etc/systemd/system/ollama.service
```

```ini
[Unit]
Description=Ollama Service
After=network.target

[Service]
Type=simple
User=ubuntu
ExecStart=/usr/local/bin/ollama serve
Restart=always

[Install]
WantedBy=multi-user.target
```

**Create Minecraft service:**
```bash
sudo nano /etc/systemd/system/minecraft.service
```

```ini
[Unit]
Description=Minecraft Fabric Server
After=network.target

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/craftbot-mcp/minecraft-server
ExecStart=/usr/bin/java -Xms2G -Xmx3G -jar fabric-server-launch.jar nogui
Restart=always

[Install]
WantedBy=multi-user.target
```

**Create MCP service:**
```bash
sudo nano /etc/systemd/system/craftbot-mcp.service
```

```ini
[Unit]
Description=CraftBot MCP Server
After=network.target ollama.service

[Service]
Type=simple
User=ubuntu
WorkingDirectory=/home/ubuntu/craftbot-mcp
ExecStart=/usr/bin/npm run server
Restart=always

[Install]
WantedBy=multi-user.target
```

**Enable and start services:**
```bash
sudo systemctl daemon-reload
sudo systemctl enable ollama minecraft craftbot-mcp
sudo systemctl start ollama minecraft craftbot-mcp

# Check status
sudo systemctl status ollama
sudo systemctl status minecraft
sudo systemctl status craftbot-mcp
```

### Step 7: Configure Nginx (Optional - for HTTPS)
```bash
# Install Nginx
sudo apt install nginx -y

# Configure reverse proxy
sudo nano /etc/nginx/sites-available/craftbot
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /ws {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    location / {
        proxy_pass http://localhost:5173;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/craftbot /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: Monitor Logs
```bash
# View service logs
sudo journalctl -u ollama -f
sudo journalctl -u minecraft -f
sudo journalctl -u craftbot-mcp -f

# View application logs
tail -f ~/craftbot-mcp/server.log
tail -f ~/craftbot-mcp/minecraft-server/logs/latest.log
```

---

## Verification

After installation, verify everything is working:

### 1. Run Pre-flight Check
```bash
npm run preflight
```

Expected output:
```
✓ Node.js version is 18 or higher
✓ npm is installed
✓ node_modules directory exists
✓ .env file exists
✓ RCON_PASSWORD configured
✓ Ollama is running and accessible
✓ Port 3000 is available
✓ All required files exist
```

### 2. Test Ollama Connection
```bash
curl http://localhost:11434/api/tags
```

Expected: JSON response with installed models

### 3. Test Minecraft RCON
```bash
npm run test:health
```

Expected: All endpoints return status 200

### 4. Run Integration Tests
```bash
npm run test:integration
```

Expected: All tests pass

### 5. Connect to Minecraft
1. Open Minecraft Java Edition
2. Click "Multiplayer"
3. Click "Add Server"
4. Server Address: `localhost:25565` (or EC2 IP for remote)
5. Click "Done" and "Join Server"

### 6. Access Web Interface
- **Frontend:** http://localhost:5173 (or EC2 IP:5173)
- **API:** http://localhost:3000/api/health
- **Config:** http://localhost:5173/config

---

## Next Steps

1. **Configure Entities:**
   - Open http://localhost:5173/config
   - Create your first AI NPC
   - Set permissions and personality

2. **Test AI Responses:**
   - Join Minecraft server
   - Chat with your AI NPC
   - Watch responses in real-time

3. **Customize:**
   - Edit entity prompts in config page
   - Adjust performance settings in `.env`
   - Add custom commands to `data/minecraft-commands.csv`

4. **Monitor:**
   - Check logs: `npm run debug`
   - View web dashboard: http://localhost:5173

5. **Read Documentation:**
   - [Quick Start Guide](QUICK_START.md)
   - [Troubleshooting](TROUBLESHOOTING.md)
   - [Architecture](docs/SERVER_ARCHITECTURE.md)
   - [API Reference](docs/README.md)

---

## Troubleshooting

### Common Issues

**Ollama not responding:**
```bash
# Ensure Ollama is running
ollama serve

# Check if model is pulled
ollama list

# Pull model if missing
ollama pull qwen2.5:14b-instruct
```

**RCON connection failed:**
- Verify Minecraft server is running
- Check `RCON_PASSWORD` matches in `.env` and `minecraft-server/server.properties`
- Ensure port 25575 is not blocked by firewall

**Port already in use:**
```bash
# Find process using port 3000
lsof -i :3000  # macOS/Linux
netstat -ano | findstr :3000  # Windows

# Kill process or change port in .env
```

**Permission denied on scripts:**
```bash
chmod +x scripts/*.sh
```

For more troubleshooting, see [TROUBLESHOOTING.md](TROUBLESHOOTING.md)

---

## Support

- **Documentation:** [docs/README.md](docs/README.md)
- **Issues:** GitHub Issues
- **Discord:** [Community Discord](#)

---

**Version:** 1.0.0
**Last Updated:** 2025-10-02
