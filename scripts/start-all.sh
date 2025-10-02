#!/bin/bash

# Craftbot MCP - Start All Services Script
# This script starts all required services for the Craftbot MCP system

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
MINECRAFT_SERVER_DIR="${MINECRAFT_SERVER_DIR:-$HOME/minecraft-server}"
OLLAMA_PORT=11434
MCP_PORT=3000
FRONTEND_PORT=5173

# Log file
LOG_DIR="$PROJECT_ROOT/logs"
mkdir -p "$LOG_DIR"
STARTUP_LOG="$LOG_DIR/startup-$(date +%Y%m%d-%H%M%S).log"

# PID file locations
PIDS_DIR="$PROJECT_ROOT/.pids"
mkdir -p "$PIDS_DIR"

# Function to print colored output
print_info() {
    echo -e "${BLUE}[INFO]${NC} $1" | tee -a "$STARTUP_LOG"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1" | tee -a "$STARTUP_LOG"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1" | tee -a "$STARTUP_LOG"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1" | tee -a "$STARTUP_LOG"
}

# Function to check if a port is in use
port_in_use() {
    lsof -i :$1 > /dev/null 2>&1
    return $?
}

# Function to check if a service is running
service_running() {
    if [ -f "$PIDS_DIR/$1.pid" ]; then
        pid=$(cat "$PIDS_DIR/$1.pid")
        if ps -p $pid > /dev/null 2>&1; then
            return 0
        fi
    fi
    return 1
}

# Function to wait for service to be ready
wait_for_service() {
    local name=$1
    local url=$2
    local max_attempts=30
    local attempt=0

    print_info "Waiting for $name to be ready..."

    while [ $attempt -lt $max_attempts ]; do
        if curl -s "$url" > /dev/null 2>&1; then
            print_success "$name is ready!"
            return 0
        fi
        attempt=$((attempt + 1))
        echo -n "."
        sleep 1
    done

    echo ""
    print_error "$name failed to start within ${max_attempts}s"
    return 1
}

# Function to start Ollama
start_ollama() {
    print_info "Checking Ollama service..."

    if port_in_use $OLLAMA_PORT; then
        print_success "Ollama is already running on port $OLLAMA_PORT"
        return 0
    fi

    # Check if Ollama is installed
    if ! command -v ollama &> /dev/null; then
        print_error "Ollama is not installed!"
        print_info "Install from: https://ollama.com/download"
        return 1
    fi

    print_info "Starting Ollama service..."

    # Start Ollama in background
    nohup ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
    echo $! > "$PIDS_DIR/ollama.pid"

    # Wait for Ollama to be ready
    if wait_for_service "Ollama" "http://localhost:$OLLAMA_PORT/api/tags"; then
        print_success "Ollama started successfully (PID: $(cat $PIDS_DIR/ollama.pid))"

        # Check if llama2 model is available
        print_info "Checking for llama2 model..."
        if ollama list | grep -q "llama2"; then
            print_success "llama2 model is available"
        else
            print_warning "llama2 model not found. Pulling now..."
            ollama pull llama2 || print_warning "Failed to pull llama2 model"
        fi
        return 0
    else
        return 1
    fi
}

# Function to start MCP Backend Server
start_backend() {
    print_info "Checking MCP Backend Server..."

    if port_in_use $MCP_PORT; then
        print_warning "Port $MCP_PORT is already in use"
        if service_running "backend"; then
            print_success "MCP Backend is already running"
            return 0
        else
            print_error "Port $MCP_PORT is in use by another process"
            return 1
        fi
    fi

    print_info "Starting MCP Backend Server..."

    # Check if .env file exists
    if [ ! -f "$PROJECT_ROOT/.env" ]; then
        print_warning ".env file not found, copying from .env.example"
        cp "$PROJECT_ROOT/.env.example" "$PROJECT_ROOT/.env"
        print_warning "Please edit .env with your RCON password and settings"
    fi

    # Start backend server
    cd "$PROJECT_ROOT"
    nohup npm run server > "$LOG_DIR/backend.log" 2>&1 &
    echo $! > "$PIDS_DIR/backend.pid"

    # Wait for backend to be ready
    if wait_for_service "MCP Backend" "http://localhost:$MCP_PORT/api/server/status"; then
        print_success "MCP Backend started successfully (PID: $(cat $PIDS_DIR/backend.pid))"
        return 0
    else
        return 1
    fi
}

# Function to start Frontend Dev Server
start_frontend() {
    print_info "Checking Frontend Dev Server..."

    if port_in_use $FRONTEND_PORT; then
        print_warning "Port $FRONTEND_PORT is already in use"
        if service_running "frontend"; then
            print_success "Frontend is already running"
            return 0
        else
            print_error "Port $FRONTEND_PORT is in use by another process"
            return 1
        fi
    fi

    print_info "Starting Frontend Dev Server..."

    cd "$PROJECT_ROOT"
    nohup npm run dev > "$LOG_DIR/frontend.log" 2>&1 &
    echo $! > "$PIDS_DIR/frontend.pid"

    # Wait for frontend to be ready
    if wait_for_service "Frontend" "http://localhost:$FRONTEND_PORT"; then
        print_success "Frontend started successfully (PID: $(cat $PIDS_DIR/frontend.pid))"
        return 0
    else
        return 1
    fi
}

# Function to check Minecraft server
check_minecraft() {
    print_info "Checking Minecraft Server..."

    if [ ! -d "$MINECRAFT_SERVER_DIR" ]; then
        print_warning "Minecraft server directory not found: $MINECRAFT_SERVER_DIR"
        print_info "Set MINECRAFT_SERVER_DIR environment variable or install server"
        print_info "See: docs/setup-guide.md for instructions"
        return 1
    fi

    # Check if server is running by looking for server.properties
    if [ -f "$MINECRAFT_SERVER_DIR/server.properties" ]; then
        # Check RCON settings
        if grep -q "enable-rcon=true" "$MINECRAFT_SERVER_DIR/server.properties"; then
            print_success "Minecraft server found with RCON enabled"

            # Check if server process is running
            if pgrep -f "fabric-server-launch.jar" > /dev/null; then
                print_success "Minecraft server is running"
            else
                print_warning "Minecraft server is not running"
                print_info "Start with: cd $MINECRAFT_SERVER_DIR && java -Xmx4G -jar fabric-server-launch.jar nogui"
            fi
        else
            print_warning "RCON is not enabled in server.properties"
            print_info "Enable with: enable-rcon=true, rcon.port=25575, rcon.password=<your_password>"
        fi
    else
        print_warning "Minecraft server not configured (server.properties not found)"
    fi

    return 0
}

# Function to display service status
show_status() {
    echo ""
    print_info "=== Service Status ==="
    echo ""

    # Ollama
    if port_in_use $OLLAMA_PORT; then
        echo -e "  ${GREEN}●${NC} Ollama:           Running on port $OLLAMA_PORT"
    else
        echo -e "  ${RED}●${NC} Ollama:           Not running"
    fi

    # MCP Backend
    if port_in_use $MCP_PORT; then
        echo -e "  ${GREEN}●${NC} MCP Backend:      Running on port $MCP_PORT"
    else
        echo -e "  ${RED}●${NC} MCP Backend:      Not running"
    fi

    # Frontend
    if port_in_use $FRONTEND_PORT; then
        echo -e "  ${GREEN}●${NC} Frontend:         Running on port $FRONTEND_PORT"
    else
        echo -e "  ${RED}●${NC} Frontend:         Not running"
    fi

    # Minecraft
    if pgrep -f "fabric-server-launch.jar" > /dev/null; then
        echo -e "  ${GREEN}●${NC} Minecraft Server: Running"
    else
        echo -e "  ${YELLOW}●${NC} Minecraft Server: Not running"
    fi

    echo ""
    print_info "=== Access URLs ==="
    echo ""
    echo "  Frontend:     http://localhost:$FRONTEND_PORT"
    echo "  API:          http://localhost:$MCP_PORT/api"
    echo "  Ollama:       http://localhost:$OLLAMA_PORT"
    echo ""
    print_info "=== Logs ==="
    echo ""
    echo "  Startup:      $STARTUP_LOG"
    echo "  Ollama:       $LOG_DIR/ollama.log"
    echo "  Backend:      $LOG_DIR/backend.log"
    echo "  Frontend:     $LOG_DIR/frontend.log"
    echo ""
}

# Function to stop all services
stop_all() {
    print_info "Stopping all services..."

    for service in frontend backend ollama; do
        if [ -f "$PIDS_DIR/$service.pid" ]; then
            pid=$(cat "$PIDS_DIR/$service.pid")
            if ps -p $pid > /dev/null 2>&1; then
                print_info "Stopping $service (PID: $pid)..."
                kill $pid
                rm "$PIDS_DIR/$service.pid"
            fi
        fi
    done

    print_success "All services stopped"
}

# Main execution
main() {
    echo ""
    echo "╔════════════════════════════════════════╗"
    echo "║     Craftbot MCP - Startup Script     ║"
    echo "╚════════════════════════════════════════╝"
    echo ""

    print_info "Project root: $PROJECT_ROOT"
    print_info "Startup log: $STARTUP_LOG"
    echo ""

    # Parse command line arguments
    case "${1:-start}" in
        start)
            # Check dependencies
            print_info "Checking dependencies..."

            if ! command -v node &> /dev/null; then
                print_error "Node.js is not installed!"
                exit 1
            fi

            if ! command -v npm &> /dev/null; then
                print_error "npm is not installed!"
                exit 1
            fi

            # Install npm dependencies if needed
            if [ ! -d "$PROJECT_ROOT/node_modules" ]; then
                print_info "Installing npm dependencies..."
                cd "$PROJECT_ROOT"
                npm install || { print_error "Failed to install dependencies"; exit 1; }
            fi

            # Start services
            start_ollama || print_warning "Ollama failed to start"
            start_backend || { print_error "Backend failed to start"; exit 1; }
            start_frontend || { print_error "Frontend failed to start"; exit 1; }
            check_minecraft

            # Show status
            show_status

            print_success "All services started successfully!"
            print_info "Press Ctrl+C to view service management menu"
            echo ""

            # Keep script running and monitor services
            trap stop_all EXIT

            # Wait for user interrupt
            while true; do
                sleep 1
            done
            ;;

        stop)
            stop_all
            ;;

        status)
            show_status
            ;;

        restart)
            stop_all
            sleep 2
            $0 start
            ;;

        logs)
            service="${2:-all}"
            if [ "$service" = "all" ]; then
                tail -f "$LOG_DIR"/*.log
            else
                tail -f "$LOG_DIR/$service.log"
            fi
            ;;

        *)
            echo "Usage: $0 {start|stop|status|restart|logs [service]}"
            echo ""
            echo "Commands:"
            echo "  start    - Start all services"
            echo "  stop     - Stop all services"
            echo "  status   - Show service status"
            echo "  restart  - Restart all services"
            echo "  logs     - Tail logs (all or specify: ollama, backend, frontend)"
            echo ""
            exit 1
            ;;
    esac
}

# Run main function
main "$@"
