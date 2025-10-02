#!/bin/bash

# Ollama Setup Script for CraftBot-MCP
# Ensures Ollama is installed, pulls qwen2.5:14b-instruct model, and verifies it works

set -e

echo "=========================================="
echo "CraftBot-MCP Ollama Setup"
echo "=========================================="
echo ""

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

MODEL_NAME="qwen2.5:14b-instruct"
OLLAMA_URL="${OLLAMA_URL:-http://localhost:11434}"

# Function to print colored messages
print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "${BLUE}ℹ${NC} $1"
}

# Check if Ollama is installed
echo "Checking if Ollama is installed..."
if command -v ollama &> /dev/null; then
    OLLAMA_VERSION=$(ollama --version 2>&1 | head -n1)
    print_success "Ollama is installed: $OLLAMA_VERSION"
else
    print_error "Ollama is not installed"
    echo ""
    echo "Please install Ollama from: https://ollama.ai/download"
    echo ""
    echo "Installation instructions:"
    echo "  macOS/Linux: curl -fsSL https://ollama.ai/install.sh | sh"
    echo "  Windows: Download from https://ollama.ai/download/windows"
    echo ""
    exit 1
fi

echo ""

# Check if Ollama service is running
echo "Checking if Ollama service is running..."
if curl -s "${OLLAMA_URL}/api/tags" > /dev/null 2>&1; then
    print_success "Ollama service is running at ${OLLAMA_URL}"
else
    print_error "Ollama service is not responding at ${OLLAMA_URL}"
    echo ""
    print_info "Starting Ollama service..."
    echo "Run this command in another terminal: ollama serve"
    echo ""
    exit 1
fi

echo ""

# List currently installed models
echo "Listing installed models..."
INSTALLED_MODELS=$(ollama list 2>/dev/null || echo "")
if [ -z "$INSTALLED_MODELS" ]; then
    print_warning "No models currently installed"
else
    echo "$INSTALLED_MODELS"
fi

echo ""

# Check if the model is already installed
echo "Checking if ${MODEL_NAME} is installed..."
if ollama list | grep -q "${MODEL_NAME}"; then
    print_success "${MODEL_NAME} is already installed"
    SKIP_PULL=true
else
    print_warning "${MODEL_NAME} is not installed"
    SKIP_PULL=false
fi

echo ""

# Pull the model if not installed
if [ "$SKIP_PULL" = false ]; then
    echo "Pulling ${MODEL_NAME}..."
    print_info "This may take several minutes depending on your internet connection"
    print_info "Model size: ~8.5GB"
    echo ""

    if ollama pull "${MODEL_NAME}"; then
        print_success "Successfully pulled ${MODEL_NAME}"
    else
        print_error "Failed to pull ${MODEL_NAME}"
        exit 1
    fi
    echo ""
fi

# Show model info
echo "Getting model information..."
MODEL_INFO=$(ollama show "${MODEL_NAME}" 2>&1 || echo "")
if [ -n "$MODEL_INFO" ]; then
    print_success "Model details:"
    echo "$MODEL_INFO" | head -n 20
else
    print_warning "Could not retrieve model information"
fi

echo ""

# Test the model with a simple query
echo "Testing ${MODEL_NAME} with a sample query..."
print_info "Sending test prompt..."

TEST_PROMPT="You are a helpful Minecraft NPC. Respond using XML tags as follows:
<thinking>Your internal reasoning</thinking>
<say>Your spoken response</say>

Player says: Hello! Who are you?"

echo ""
print_info "Test prompt: 'Hello! Who are you?'"
echo ""

RESPONSE=$(ollama run "${MODEL_NAME}" "${TEST_PROMPT}" 2>&1)

if [ $? -eq 0 ]; then
    print_success "Model responded successfully!"
    echo ""
    echo "Response:"
    echo "----------------------------------------"
    echo "$RESPONSE"
    echo "----------------------------------------"
    echo ""

    # Check if response contains XML tags
    if echo "$RESPONSE" | grep -q "<thinking>" && echo "$RESPONSE" | grep -q "<say>"; then
        print_success "Model correctly uses XML tags!"
    else
        print_warning "Model response does not contain expected XML tags"
        print_info "You may need to adjust the system prompt for better XML formatting"
    fi
else
    print_error "Model test failed"
    echo "$RESPONSE"
    exit 1
fi

echo ""

# Final summary
echo "=========================================="
echo "Setup Summary"
echo "=========================================="
print_success "Ollama is installed and running"
print_success "${MODEL_NAME} is installed"
print_success "Model responds to queries"
echo ""
print_info "Model: ${MODEL_NAME}"
print_info "Ollama URL: ${OLLAMA_URL}"
print_info "Temperature (default): 0.7"
echo ""
echo "Configuration updated in:"
echo "  - src/config/defaultConfig.js"
echo ""
echo "Next steps:"
echo "  1. Update your .env file if using custom Ollama URL"
echo "  2. Test with: node scripts/test-ollama.js"
echo "  3. Try sample prompts from: test-prompts.txt"
echo ""
print_success "Setup complete!"
