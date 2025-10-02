import { useState, useEffect } from 'react';
import { wsManager } from '../services/api';
import './ConnectionStatus.css';

export default function ConnectionStatus() {
  const [connectionState, setConnectionState] = useState(wsManager.getConnectionState());
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const unsubscribe = wsManager.subscribe('connection', (state) => {
      setConnectionState(state);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const getStatusInfo = () => {
    switch (connectionState) {
      case 'connected':
        return {
          icon: '●',
          label: 'Connected',
          color: '#0f0',
          description: 'WebSocket connection active'
        };
      case 'connecting':
        return {
          icon: '◐',
          label: 'Connecting',
          color: '#ff0',
          description: 'Establishing WebSocket connection...'
        };
      case 'disconnected':
        return {
          icon: '○',
          label: 'Disconnected',
          color: '#666',
          description: 'WebSocket disconnected. Attempting to reconnect...'
        };
      case 'error':
        return {
          icon: '✕',
          label: 'Error',
          color: '#f00',
          description: 'WebSocket connection error. Retrying...'
        };
      default:
        return {
          icon: '?',
          label: 'Unknown',
          color: '#888',
          description: 'Connection status unknown'
        };
    }
  };

  const statusInfo = getStatusInfo();

  const handleReconnect = () => {
    wsManager.disconnect();
    setTimeout(() => {
      wsManager.connect();
    }, 100);
  };

  return (
    <div
      className={`connection-status ${connectionState}`}
      onMouseEnter={() => setIsExpanded(true)}
      onMouseLeave={() => setIsExpanded(false)}
    >
      <div className="status-indicator">
        <span
          className="status-icon"
          style={{ color: statusInfo.color }}
        >
          {statusInfo.icon}
        </span>
        <span className="status-label">{statusInfo.label}</span>
      </div>

      {isExpanded && (
        <div className="status-details">
          <div className="status-description">{statusInfo.description}</div>
          <div className="status-actions">
            {connectionState !== 'connected' && connectionState !== 'connecting' && (
              <button onClick={handleReconnect} className="btn-reconnect">
                Reconnect
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
