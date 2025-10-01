// API service layer for communicating with the MCP backend
// All methods use try/catch and return null on error

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

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
      return await response.json();
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
  }
};
