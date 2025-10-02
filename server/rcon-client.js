import { Rcon } from 'rcon-client';
import dotenv from 'dotenv';

dotenv.config();

class RconClient {
  constructor() {
    this.client = null;
    this.connected = false;
    this.connecting = false;
    this.commandQueue = [];
    this.processing = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 10;
    this.reconnectDelay = 5000;
    this.commandDelay = parseInt(process.env.COMMAND_QUEUE_DELAY) || 100;

    this.config = {
      host: process.env.RCON_HOST || 'localhost',
      port: parseInt(process.env.RCON_PORT) || 25575,
      password: process.env.RCON_PASSWORD || ''
    };

    this.listeners = {
      connected: [],
      disconnected: [],
      error: [],
      response: []
    };
  }

  async connect() {
    if (this.connected || this.connecting) {
      console.log('[RCON] Already connected or connecting');
      return true;
    }

    this.connecting = true;
    console.log(`[RCON] Connecting to ${this.config.host}:${this.config.port}...`);

    try {
      this.client = await Rcon.connect({
        host: this.config.host,
        port: this.config.port,
        password: this.config.password
      });

      this.connected = true;
      this.connecting = false;
      this.reconnectAttempts = 0;

      console.log('[RCON] Connected successfully');
      this.emit('connected');

      // Handle disconnection
      this.client.on('end', () => {
        console.log('[RCON] Connection ended');
        this.handleDisconnect();
      });

      this.client.on('error', (error) => {
        console.error('[RCON] Connection error:', error.message);
        this.emit('error', error);
      });

      return true;
    } catch (error) {
      console.error('[RCON] Failed to connect:', error.message);
      this.connecting = false;
      this.connected = false;
      this.emit('error', error);

      // Attempt to reconnect
      if (this.reconnectAttempts < this.maxReconnectAttempts) {
        this.reconnectAttempts++;
        console.log(`[RCON] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
        setTimeout(() => this.connect(), this.reconnectDelay);
      } else {
        console.error('[RCON] Max reconnect attempts reached');
      }

      return false;
    }
  }

  handleDisconnect() {
    this.connected = false;
    this.connecting = false;
    this.emit('disconnected');

    // Attempt to reconnect
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`[RCON] Reconnecting in ${this.reconnectDelay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
      setTimeout(() => this.connect(), this.reconnectDelay);
    }
  }

  async disconnect() {
    if (this.client) {
      try {
        await this.client.end();
        this.connected = false;
        console.log('[RCON] Disconnected');
      } catch (error) {
        console.error('[RCON] Error disconnecting:', error.message);
      }
    }
  }

  async sendCommand(command) {
    return new Promise((resolve) => {
      this.commandQueue.push({ command, resolve });
      this.processQueue();
    });
  }

  async processQueue() {
    if (this.processing || this.commandQueue.length === 0) {
      return;
    }

    this.processing = true;

    while (this.commandQueue.length > 0) {
      const { command, resolve } = this.commandQueue.shift();

      try {
        if (!this.connected) {
          console.log('[RCON] Not connected, attempting to connect...');
          const connected = await this.connect();
          if (!connected) {
            resolve({
              success: false,
              error: 'Not connected to RCON server'
            });
            continue;
          }
        }

        console.log(`[RCON] Executing: ${command}`);

        if (!this.client) {
          resolve({
            success: false,
            error: 'RCON client not initialized'
          });
          continue;
        }

        const response = await this.client.send(command);

        const result = {
          success: true,
          response: response || 'Command executed',
          command
        };

        this.emit('response', result);
        resolve(result);

        // Delay between commands to prevent overwhelming the server
        if (this.commandQueue.length > 0) {
          await new Promise(resolve => setTimeout(resolve, this.commandDelay));
        }
      } catch (error) {
        console.error(`[RCON] Error executing command "${command}":`, error.message);

        const result = {
          success: false,
          error: error.message,
          command
        };

        this.emit('error', error);
        resolve(result);

        // If connection error, try to reconnect
        if (error.message.includes('connect') || error.message.includes('ECONNREFUSED')) {
          this.connected = false;
          await this.connect();
        }
      }
    }

    this.processing = false;
  }

  isConnected() {
    return this.connected;
  }

  getStatus() {
    return {
      connected: this.connected,
      connecting: this.connecting,
      reconnectAttempts: this.reconnectAttempts,
      queueLength: this.commandQueue.length,
      config: {
        host: this.config.host,
        port: this.config.port
      }
    };
  }

  on(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event].push(callback);
    }
  }

  off(event, callback) {
    if (this.listeners[event]) {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    }
  }

  emit(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }
}

// Export singleton instance
export const rconClient = new RconClient();

// Auto-connect on module load
rconClient.connect();
