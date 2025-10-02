// API service layer for communicating with the MCP backend
// All methods use try/catch and return null on error

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const WS_BASE_URL = import.meta.env.VITE_WS_URL || 'ws://localhost:3000';

// WebSocket Connection Manager
class WebSocketManager {
  constructor() {
    this.ws = null;
    this.reconnectTimeout = null;
    this.reconnectDelay = 3000;
    this.maxReconnectDelay = 30000;
    this.currentReconnectDelay = this.reconnectDelay;
    this.listeners = {
      log: [],
      config: [],
      status: [],
      connection: [],
      players: [],
      entities: []
    };
    this.connectionState = 'disconnected'; // disconnected, connecting, connected, error
  }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) {
      return;
    }

    this.connectionState = 'connecting';
    this.notifyConnectionListeners();

    try {
      this.ws = new WebSocket(WS_BASE_URL);

      this.ws.onopen = () => {
        console.log('WebSocket connected');
        this.connectionState = 'connected';
        this.currentReconnectDelay = this.reconnectDelay;
        this.notifyConnectionListeners();
      };

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          this.handleMessage(data);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      this.ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionState = 'error';
        this.notifyConnectionListeners();
      };

      this.ws.onclose = () => {
        console.log('WebSocket disconnected');
        this.connectionState = 'disconnected';
        this.notifyConnectionListeners();
        this.scheduleReconnect();
      };
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionState = 'error';
      this.notifyConnectionListeners();
      this.scheduleReconnect();
    }
  }

  handleMessage(data) {
    const { type, payload } = data;

    switch (type) {
      case 'log':
        this.notifyListeners('log', payload);
        break;
      case 'config':
        this.notifyListeners('config', payload);
        break;
      case 'status':
        this.notifyListeners('status', payload);
        break;
      case 'players':
        this.notifyListeners('players', payload);
        break;
      case 'entities':
        this.notifyListeners('entities', payload);
        break;
      case 'connected':
        // Handle initial connection payload
        if (payload.players) {
          this.notifyListeners('players', payload.players);
        }
        if (payload.entities) {
          this.notifyListeners('entities', payload.entities);
        }
        break;
      default:
        console.warn('Unknown WebSocket message type:', type);
    }
  }

  scheduleReconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }

    this.reconnectTimeout = setTimeout(() => {
      console.log(`Attempting to reconnect in ${this.currentReconnectDelay}ms...`);
      this.connect();
      this.currentReconnectDelay = Math.min(
        this.currentReconnectDelay * 1.5,
        this.maxReconnectDelay
      );
    }, this.currentReconnectDelay);
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }

    this.connectionState = 'disconnected';
    this.notifyConnectionListeners();
  }

  subscribe(event, callback) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);

    return () => {
      this.listeners[event] = this.listeners[event].filter(cb => cb !== callback);
    };
  }

  notifyListeners(event, data) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => callback(data));
    }
  }

  notifyConnectionListeners() {
    this.notifyListeners('connection', this.connectionState);
  }

  send(type, payload) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type, payload }));
    } else {
      console.warn('WebSocket is not connected. Message not sent:', { type, payload });
    }
  }

  getConnectionState() {
    return this.connectionState;
  }
}

// Create singleton instance
export const wsManager = new WebSocketManager();

// Auto-connect on module load
wsManager.connect();

export const api = {
  // Get server logs
  async getLogs() {
    try {
      const response = await fetch(`${API_BASE_URL}/logs`);
      if (!response.ok) throw new Error('Failed to fetch logs');
      return await response.json();
    } catch (error) {
      console.error('API Error (getLogs):', error);
      return [];
    }
  },

  // Get config
  async getConfig() {
    try {
      const response = await fetch(`${API_BASE_URL}/config`);
      if (!response.ok) throw new Error('Failed to fetch config');
      return await response.json();
    } catch (error) {
      console.error('API Error (getConfig):', error);
      return null;
    }
  },

  // Update config
  async updateConfig(config) {
    try {
      const response = await fetch(`${API_BASE_URL}/config`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      if (!response.ok) throw new Error('Failed to update config');
      const result = await response.json();

      // Also send via WebSocket for real-time sync
      wsManager.send('config:update', config);

      return result;
    } catch (error) {
      console.error('API Error (updateConfig):', error);
      return null;
    }
  },

  // Get entities
  async getEntities() {
    try {
      const response = await fetch(`${API_BASE_URL}/entities`);
      if (!response.ok) throw new Error('Failed to fetch entities');
      return await response.json();
    } catch (error) {
      console.error('API Error (getEntities):', error);
      return [];
    }
  },

  // Add entity
  async addEntity(entity) {
    try {
      const response = await fetch(`${API_BASE_URL}/entities`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity)
      });
      if (!response.ok) throw new Error('Failed to add entity');
      return await response.json();
    } catch (error) {
      console.error('API Error (addEntity):', error);
      return null;
    }
  },

  // Update entity
  async updateEntity(id, entity) {
    try {
      const response = await fetch(`${API_BASE_URL}/entities/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entity)
      });
      if (!response.ok) throw new Error('Failed to update entity');
      return await response.json();
    } catch (error) {
      console.error('API Error (updateEntity):', error);
      return null;
    }
  },

  // Delete entity
  async deleteEntity(id) {
    try {
      const response = await fetch(`${API_BASE_URL}/entities/${id}`, {
        method: 'DELETE'
      });
      if (!response.ok) throw new Error('Failed to delete entity');
      return true;
    } catch (error) {
      console.error('API Error (deleteEntity):', error);
      return false;
    }
  },

  // Send RCON command
  async sendCommand(command) {
    try {
      const response = await fetch(`${API_BASE_URL}/rcon/command`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command })
      });
      if (!response.ok) throw new Error('Failed to send command');
      return await response.json();
    } catch (error) {
      console.error('API Error (sendCommand):', error);
      return null;
    }
  },

  // Get server status
  async getServerStatus() {
    try {
      const response = await fetch(`${API_BASE_URL}/server/status`);
      if (!response.ok) throw new Error('Failed to fetch server status');
      return await response.json();
    } catch (error) {
      console.error('API Error (getServerStatus):', error);
      return null;
    }
  },

  // Validate command permissions
  async validateCommand(command, entityId) {
    try {
      const response = await fetch(`${API_BASE_URL}/commands/validate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command, entityId })
      });
      if (!response.ok) throw new Error('Failed to validate command');
      return await response.json();
    } catch (error) {
      console.error('API Error (validateCommand):', error);
      return null;
    }
  },

  // Get available Ollama models
  async getOllamaModels() {
    try {
      const response = await fetch(`${API_BASE_URL}/ollama/models`);
      if (!response.ok) throw new Error('Failed to fetch Ollama models');
      return await response.json();
    } catch (error) {
      console.error('API Error (getOllamaModels):', error);
      return { success: false, models: [], error: error.message };
    }
  },

  // Check Ollama health
  async getOllamaHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/ollama/health`);
      if (!response.ok) throw new Error('Failed to check Ollama health');
      return await response.json();
    } catch (error) {
      console.error('API Error (getOllamaHealth):', error);
      return { success: false, available: false, error: error.message };
    }
  }
};
