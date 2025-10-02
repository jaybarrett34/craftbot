/**
 * Ollama Client
 *
 * Handles communication with Ollama API for LLM inference
 * - Formats messages for Ollama API
 * - Manages streaming and non-streaming responses
 * - Builds system prompts with NPC personality and context
 * - Handles conversation history
 */

class OllamaClient {
  constructor(options = {}) {
    this.config = {
      host: options.host || 'http://localhost:11434',
      defaultModel: options.defaultModel || 'llama2',
      defaultTemperature: options.defaultTemperature || 0.7,
      timeout: options.timeout || 30000,
      retries: options.retries || 3,
      ...options
    };
  }

  /**
   * Build system prompt for NPC
   * @param {Object} entity - Entity configuration
   * @returns {string} System prompt
   */
  buildSystemPrompt(entity) {
    const parts = [];

    // Base identity
    parts.push(`You are ${entity.name}, a character in Minecraft.`);

    // Personality
    if (entity.context?.personality) {
      parts.push(entity.context.personality);
    }

    // Context awareness
    if (entity.context?.systemPrompt) {
      parts.push(entity.context.systemPrompt);
    }

    // World state capabilities
    if (entity.context?.worldState) {
      const ws = entity.context.worldState;
      const capabilities = [];

      if (ws.canSeeNearbyPlayers) capabilities.push('players');
      if (ws.canSeeNearbyNPCs) capabilities.push('other NPCs');
      if (ws.canSeeNearbyMobs) capabilities.push('mobs');

      if (capabilities.length > 0) {
        const radius = ws.perceptionRadius === -1 ? 'unlimited' : `${ws.perceptionRadius} blocks`;
        parts.push(`You can perceive ${capabilities.join(', ')} within ${radius}.`);
      }
    }

    // XML tag instructions
    parts.push('');
    parts.push('Use these XML tags in your response:');
    parts.push('- <thinking>your internal reasoning</thinking> for thoughts');
    parts.push('- <say>your speech</say> for what you want to say (can be used multiple times)');
    parts.push('- <function>minecraft command</function> for commands (can be used multiple times)');
    parts.push('- <silence/> to explicitly choose not to speak');
    parts.push('');
    parts.push('Examples:');
    parts.push('<thinking>Steve greeted me. I should respond warmly.</thinking>');
    parts.push('<say>Hello Steve! Beautiful day, isn\'t it?</say>');
    parts.push('');
    parts.push('<thinking>Player needs help. I can give them tools.</thinking>');
    parts.push('<say>Let me help you with that.</say>');
    parts.push('<function>/give @p minecraft:diamond_sword 1</function>');
    parts.push('');
    parts.push('<thinking>Too far away to interact meaningfully.</thinking>');
    parts.push('<silence/>');

    // Command permissions
    if (entity.permissions?.canExecuteCommands) {
      parts.push('');
      parts.push('You can execute Minecraft commands.');

      if (entity.permissions.allowedCommands?.includes('*')) {
        parts.push('You have access to all commands.');
      } else if (entity.permissions.allowedCommands?.length > 0) {
        parts.push(`Allowed commands: ${entity.permissions.allowedCommands.join(', ')}`);
      }

      if (entity.permissions.deniedCommands?.length > 0) {
        parts.push(`Denied commands: ${entity.permissions.deniedCommands.join(', ')}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Format user message with context
   * @param {Object} batch - Batched messages
   * @returns {string} Formatted user message
   */
  formatUserMessage(batch) {
    const parts = [];

    // Player messages
    if (batch.playerMessages && batch.playerMessages.length > 0) {
      for (const msg of batch.playerMessages) {
        const proximity = msg.proximity !== null && msg.proximity !== undefined
          ? `[Player proximity: ${msg.proximity} blocks]`
          : '';
        parts.push(`${proximity} <${msg.sender}> ${msg.content}`.trim());
      }
    }

    // NPC messages
    if (batch.npcMessages && batch.npcMessages.length > 0) {
      for (const msg of batch.npcMessages) {
        parts.push(`[Another NPC said] <${msg.sender}> ${msg.content}`);
      }
    }

    return parts.join('\n');
  }

  /**
   * Build messages array for Ollama API
   * @param {Object} entity - Entity configuration
   * @param {Object} batch - Batched messages
   * @param {string} conversationSummary - Previous conversation summary
   * @returns {Array<Object>} Messages array
   */
  buildMessages(entity, batch, conversationSummary = '') {
    const messages = [];

    // System prompt
    messages.push({
      role: 'system',
      content: this.buildSystemPrompt(entity)
    });

    // Conversation history summary
    if (conversationSummary) {
      messages.push({
        role: 'user',
        content: `Previous conversation:\n${conversationSummary}`
      });
    }

    // Current batch
    messages.push({
      role: 'user',
      content: this.formatUserMessage(batch)
    });

    return messages;
  }

  /**
   * Send request to Ollama API
   * @param {Object} entity - Entity configuration
   * @param {Object} batch - Batched messages
   * @param {string} conversationSummary - Previous conversation summary
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async generateResponse(entity, batch, conversationSummary = '', options = {}) {
    const model = entity.llm?.model || this.config.defaultModel;
    const temperature = entity.llm?.temperature !== undefined
      ? entity.llm.temperature
      : this.config.defaultTemperature;

    const requestBody = {
      model,
      messages: this.buildMessages(entity, batch, conversationSummary),
      stream: options.stream || false,
      options: {
        temperature,
        ...options.modelOptions
      }
    };

    try {
      const response = await this.makeRequest('/api/chat', requestBody, options.timeout);
      return response;
    } catch (error) {
      console.error('Ollama API error:', error);
      throw error;
    }
  }

  /**
   * Make HTTP request to Ollama
   * @param {string} endpoint - API endpoint
   * @param {Object} body - Request body
   * @param {number} timeout - Request timeout
   * @returns {Promise<Object>} Response data
   */
  async makeRequest(endpoint, body, timeout = null) {
    const url = `${this.config.host}${endpoint}`;
    const timeoutMs = timeout || this.config.timeout;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error.name === 'AbortError') {
        throw new Error('Request timeout');
      }

      throw error;
    }
  }

  /**
   * Stream response from Ollama (for real-time output)
   * @param {Object} entity - Entity configuration
   * @param {Object} batch - Batched messages
   * @param {string} conversationSummary - Previous conversation summary
   * @param {Function} onChunk - Callback for each chunk
   * @returns {Promise<string>} Complete response
   */
  async streamResponse(entity, batch, conversationSummary = '', onChunk) {
    const model = entity.llm?.model || this.config.defaultModel;
    const temperature = entity.llm?.temperature !== undefined
      ? entity.llm.temperature
      : this.config.defaultTemperature;

    const requestBody = {
      model,
      messages: this.buildMessages(entity, batch, conversationSummary),
      stream: true,
      options: {
        temperature
      }
    };

    const url = `${this.config.host}/api/chat`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullResponse = '';

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (json.message?.content) {
              fullResponse += json.message.content;
              if (onChunk) {
                onChunk(json.message.content);
              }
            }
          } catch (e) {
            console.warn('Failed to parse chunk:', e);
          }
        }
      }

      return fullResponse;
    } catch (error) {
      console.error('Ollama streaming error:', error);
      throw error;
    }
  }

  /**
   * Check if Ollama is available
   * @returns {Promise<boolean>} Availability status
   */
  async checkAvailability() {
    try {
      const response = await fetch(`${this.config.host}/api/tags`, {
        method: 'GET'
      });
      return response.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * List available models
   * @returns {Promise<Array<string>>} Model names
   */
  async listModels() {
    try {
      const response = await fetch(`${this.config.host}/api/tags`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();
      return data.models?.map(m => m.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  /**
   * Pull a model from Ollama library
   * @param {string} modelName - Model to pull
   * @param {Function} onProgress - Progress callback
   * @returns {Promise<boolean>} Success status
   */
  async pullModel(modelName, onProgress) {
    try {
      const response = await fetch(`${this.config.host}/api/pull`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName, stream: true })
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            if (onProgress) {
              onProgress(json);
            }
          } catch (e) {
            console.warn('Failed to parse progress:', e);
          }
        }
      }

      return true;
    } catch (error) {
      console.error('Failed to pull model:', error);
      return false;
    }
  }
}

// Export class (not singleton, allow custom instances)
export default OllamaClient;
