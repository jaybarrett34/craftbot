#!/bin/bash

# Craftbot MCP - Minecraft Server Setup Script
# This script automates the installation of a Fabric Minecraft server for testing

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
MINECRAFT_VERSION="1.21.9"
FABRIC_LOADER_VERSION="0.16.9"
FABRIC_INSTALLER_VERSION="1.0.1"
FABRIC_API_VERSION="0.110.5+1.21.9"
JAVA_MIN_RAM="2G"
JAVA_MAX_RAM="4G"

# Paths
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
SERVER_DIR="$PROJECT_ROOT/minecraft-server"
ENV_FILE="$PROJECT_ROOT/.env"
ENV_EXAMPLE="$PROJECT_ROOT/.env.example"

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

check_java() {
    print_info "Checking Java installation..."
    if ! command -v java &> /dev/null; then
        print_error "Java is not installed!"
        echo "Please install Java 17 or higher:"
        echo "  - macOS: brew install openjdk@17"
        echo "  - Linux: sudo apt install openjdk-17-jdk"
        exit 1
    fi

    JAVA_VERSION=$(java -version 2>&1 | awk -F '"' '/version/ {print $2}' | cut -d'.' -f1)
    if [ "$JAVA_VERSION" -lt 17 ]; then
        print_error "Java 17 or higher is required (found Java $JAVA_VERSION)"
        exit 1
    fi

    print_success "Java $JAVA_VERSION detected"
}

get_rcon_password() {
    # Try to read from .env file first
    if [ -f "$ENV_FILE" ]; then
        RCON_PASSWORD=$(grep "^RCON_PASSWORD=" "$ENV_FILE" | cut -d'=' -f2)
        if [ -n "$RCON_PASSWORD" ]; then
            print_info "Using RCON password from .env file"
            return
        fi
    fi

    # Prompt user for RCON password
    echo ""
    print_info "Enter RCON password (or press Enter for default: 'craftbot_rcon_pass'):"
    read -r user_input

    if [ -z "$user_input" ]; then
        RCON_PASSWORD="craftbot_rcon_pass"
    else
        RCON_PASSWORD="$user_input"
    fi

    # Update .env file if it exists
    if [ -f "$ENV_FILE" ]; then
        if grep -q "^RCON_PASSWORD=" "$ENV_FILE"; then
            # Update existing password
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^RCON_PASSWORD=.*|RCON_PASSWORD=$RCON_PASSWORD|" "$ENV_FILE"
            else
                sed -i "s|^RCON_PASSWORD=.*|RCON_PASSWORD=$RCON_PASSWORD|" "$ENV_FILE"
            fi
        else
            # Add password
            echo "RCON_PASSWORD=$RCON_PASSWORD" >> "$ENV_FILE"
        fi
        print_success "Updated .env file with RCON password"
    else
        # Create .env from .env.example
        if [ -f "$ENV_EXAMPLE" ]; then
            cp "$ENV_EXAMPLE" "$ENV_FILE"
            if [[ "$OSTYPE" == "darwin"* ]]; then
                sed -i '' "s|^RCON_PASSWORD=.*|RCON_PASSWORD=$RCON_PASSWORD|" "$ENV_FILE"
            else
                sed -i "s|^RCON_PASSWORD=.*|RCON_PASSWORD=$RCON_PASSWORD|" "$ENV_FILE"
            fi
            print_success "Created .env file with RCON password"
        fi
    fi
}

setup_server_directory() {
    print_info "Setting up server directory..."

    if [ -d "$SERVER_DIR" ]; then
        print_warning "Server directory already exists"
        echo "Do you want to remove it and start fresh? (y/n)"
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            rm -rf "$SERVER_DIR"
            print_info "Removed existing server directory"
        else
            print_info "Keeping existing server directory"
            return
        fi
    fi

    mkdir -p "$SERVER_DIR"
    cd "$SERVER_DIR"
    print_success "Server directory created at $SERVER_DIR"
}

download_fabric_installer() {
    print_info "Downloading Fabric installer..."

    INSTALLER_URL="https://maven.fabricmc.net/net/fabricmc/fabric-installer/${FABRIC_INSTALLER_VERSION}/fabric-installer-${FABRIC_INSTALLER_VERSION}.jar"

    if command -v wget &> /dev/null; then
        wget -q -O fabric-installer.jar "$INSTALLER_URL"
    elif command -v curl &> /dev/null; then
        curl -L -s -o fabric-installer.jar "$INSTALLER_URL"
    else
        print_error "Neither wget nor curl is available. Please install one of them."
        exit 1
    fi

    print_success "Downloaded Fabric installer"
}

install_fabric_server() {
    print_info "Installing Fabric server..."

    java -jar fabric-installer.jar server \
        -mcversion "$MINECRAFT_VERSION" \
        -loader "$FABRIC_LOADER_VERSION" \
        -downloadMinecraft

    print_success "Fabric server installed"
}

accept_eula() {
    print_info "Accepting Minecraft EULA..."
    echo "# Minecraft EULA - Automatically accepted by setup script" > eula.txt
    echo "# $(date)" >> eula.txt
    echo "eula=true" >> eula.txt
    print_success "EULA accepted"
}

configure_server_properties() {
    print_info "Configuring server.properties..."

    # Create server.properties with RCON enabled
    cat > server.properties << EOF
# Minecraft Server Properties - Craftbot MCP Testing Environment
# Generated on $(date)

# Server Settings
server-port=25565
max-players=10
online-mode=false
pvp=false
difficulty=easy
gamemode=creative
spawn-protection=0
view-distance=10
simulation-distance=10
max-world-size=10000

# Performance
max-tick-time=60000

# World Settings
level-name=craftbot_test_world
level-seed=
level-type=minecraft\:flat
generate-structures=false
spawn-monsters=false
spawn-animals=true
spawn-npcs=true

# Network Settings
enable-status=true
enable-query=false
motd=Craftbot MCP Test Server

# RCON Configuration
enable-rcon=true
rcon.port=25575
rcon.password=$RCON_PASSWORD
broadcast-rcon-to-ops=true

# Logging
enable-command-block=true
log-ips=true
EOF

    print_success "server.properties configured with RCON enabled"
}

create_mods_directory() {
    print_info "Creating mods directory..."
    mkdir -p mods
    print_success "Mods directory created"
}

download_fabric_api() {
    print_info "Downloading Fabric API..."

    # Direct download URL for Fabric API
    FABRIC_API_URL="https://cdn.modrinth.com/data/P7dR8mSH/versions/P7uGFii0/fabric-api-${FABRIC_API_VERSION}.jar"

    cd mods

    if command -v wget &> /dev/null; then
        wget -q -O "fabric-api-${FABRIC_API_VERSION}.jar" "$FABRIC_API_URL"
    elif command -v curl &> /dev/null; then
        curl -L -s -o "fabric-api-${FABRIC_API_VERSION}.jar" "$FABRIC_API_URL"
    fi

    if [ -f "fabric-api-${FABRIC_API_VERSION}.jar" ]; then
        print_success "Fabric API downloaded"
    else
        print_warning "Could not download Fabric API automatically"
        print_info "You can manually download it from: https://modrinth.com/mod/fabric-api"
    fi

    cd ..
}

create_start_script() {
    print_info "Creating start script..."

    cat > start-server.sh << 'EOF'
#!/bin/bash
# Craftbot MCP - Minecraft Server Start Script

cd "$(dirname "$0")"

echo "Starting Minecraft Fabric server..."
java -Xms2G -Xmx4G -jar fabric-server-launch.jar nogui
EOF

    chmod +x start-server.sh
    print_success "Start script created"
}

create_stop_script() {
    print_info "Creating stop script..."

    cat > stop-server.sh << 'EOF'
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
EOF

    chmod +x stop-server.sh
    print_success "Stop script created"
}

set_permissions() {
    print_info "Setting permissions..."
    chmod +x *.jar 2>/dev/null || true
    print_success "Permissions set"
}

print_summary() {
    echo ""
    echo "============================================"
    print_success "Minecraft Server Setup Complete!"
    echo "============================================"
    echo ""
    echo "Server Details:"
    echo "  - Version: Minecraft $MINECRAFT_VERSION (Fabric)"
    echo "  - Location: $SERVER_DIR"
    echo "  - Server Port: 25565"
    echo "  - RCON Port: 25575"
    echo "  - RCON Password: $RCON_PASSWORD"
    echo ""
    echo "Quick Commands:"
    echo "  Start server: cd minecraft-server && ./start-server.sh"
    echo "  Stop server:  cd minecraft-server && ./stop-server.sh"
    echo ""
    echo "Or use the convenience script:"
    echo "  ./scripts/start-minecraft.sh"
    echo ""
    echo "Next Steps:"
    echo "  1. Start the Minecraft server"
    echo "  2. Connect in Minecraft client (localhost:25565)"
    echo "  3. Run test commands from minecraft-server/test-npcs.txt"
    echo "  4. Start the Craftbot MCP server: npm run dev"
    echo ""
    echo "See TESTING_GUIDE.md for detailed testing instructions"
    echo ""
}

# Main execution
main() {
    echo ""
    echo "============================================"
    echo "  Craftbot MCP - Minecraft Server Setup"
    echo "============================================"
    echo ""

    check_java
    get_rcon_password
    setup_server_directory
    download_fabric_installer
    install_fabric_server
    accept_eula
    configure_server_properties
    create_mods_directory
    download_fabric_api
    create_start_script
    create_stop_script
    set_permissions
    print_summary
}

# Run main function
main
