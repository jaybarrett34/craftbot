import dotenv from 'dotenv';
import { ollamaLogger } from './ollama-logger.js';

dotenv.config();

class OllamaClient {
  constructor() {
    this.baseUrl = process.env.OLLAMA_URL || 'http://localhost:11434';
    this.defaultModel = process.env.OLLAMA_MODEL || 'qwen2.5:14b-instruct';
    this.timeout = 60000; // 60 seconds
  }

  async chat(messages, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;
    const stream = options.stream !== undefined ? options.stream : false;

    const startTime = Date.now();

    try {
      console.log(`[OllamaClient] Sending chat request to ${model}...`);

      const response = await fetch(`${this.baseUrl}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          messages,
          stream,
          options: {
            temperature,
            num_predict: options.maxTokens || 500
          }
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      if (stream) {
        return this.handleStreamResponse(response);
      }

      const data = await response.json();

      const duration = Date.now() - startTime;

      const result = {
        success: true,
        message: data.message,
        model: data.model,
        done: data.done,
        totalDuration: data.total_duration,
        loadDuration: data.load_duration,
        promptEvalCount: data.prompt_eval_count,
        evalCount: data.eval_count,
        durationMs: duration
      };

      return result;
    } catch (error) {
      console.error('[OllamaClient] Chat error:', error.message);
      
      const duration = Date.now() - startTime;

      return {
        success: false,
        error: error.message,
        durationMs: duration
      };
    }
  }

  async generate(prompt, options = {}) {
    const model = options.model || this.defaultModel;
    const temperature = options.temperature !== undefined ? options.temperature : 0.7;

    try {
      console.log(`[OllamaClient] Sending generate request to ${model}...`);

      const response = await fetch(`${this.baseUrl}/api/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model,
          prompt,
          stream: false,
          options: {
            temperature,
            num_predict: options.maxTokens || 500
          }
        }),
        signal: AbortSignal.timeout(this.timeout)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Ollama API error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      return {
        success: true,
        response: data.response,
        model: data.model,
        done: data.done,
        totalDuration: data.total_duration,
        loadDuration: data.load_duration
      };
    } catch (error) {
      console.error('[OllamaClient] Generate error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async handleStreamResponse(response) {
    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullMessage = '';

    try {
      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          try {
            const data = JSON.parse(line);
            if (data.message?.content) {
              fullMessage += data.message.content;
            }
          } catch (e) {
            // Ignore JSON parse errors in stream
          }
        }
      }

      return {
        success: true,
        message: {
          role: 'assistant',
          content: fullMessage
        }
      };
    } catch (error) {
      console.error('[OllamaClient] Stream error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async listModels() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`);

      if (!response.ok) {
        throw new Error(`Failed to list models: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        models: data.models || []
      };
    } catch (error) {
      console.error('[OllamaClient] List models error:', error.message);
      return {
        success: false,
        error: error.message,
        models: []
      };
    }
  }

  async checkModelExists(modelName) {
    const result = await this.listModels();

    if (!result.success) {
      return false;
    }

    return result.models.some(model => model.name === modelName);
  }

  async getModelInfo(modelName) {
    try {
      const response = await fetch(`${this.baseUrl}/api/show`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ name: modelName })
      });

      if (!response.ok) {
        throw new Error(`Failed to get model info: ${response.status}`);
      }

      const data = await response.json();

      return {
        success: true,
        modelfile: data.modelfile,
        parameters: data.parameters,
        template: data.template
      };
    } catch (error) {
      console.error('[OllamaClient] Get model info error:', error.message);
      return {
        success: false,
        error: error.message
      };
    }
  }

  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/api/tags`, {
        signal: AbortSignal.timeout(5000)
      });

      return {
        success: response.ok,
        status: response.status,
        available: response.ok
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        available: false
      };
    }
  }

  getBaseUrl() {
    return this.baseUrl;
  }

  setBaseUrl(url) {
    this.baseUrl = url;
  }

  getDefaultModel() {
    return this.defaultModel;
  }

  setDefaultModel(model) {
    this.defaultModel = model;
  }
}

// Export singleton instance
export const ollamaClient = new OllamaClient();
