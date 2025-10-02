import { useState, useRef, useEffect } from 'react';
import GlassSurfaceSimple from './GlassSurfaceSimple';
import InfiniteScroll from './InfiniteScroll';
import { api, wsManager } from '../services/api';
import './LogViewer.css';

export default function LogViewer() {
  const [viewMode, setViewMode] = useState('terminal'); // 'formatted' or 'terminal'
  const [logs, setLogs] = useState([]);
  const scrollContainerRef = useRef(null);

  const handleToggleViewMode = () => {
    setViewMode(prev => prev === 'formatted' ? 'terminal' : 'formatted');
  };

  // Fetch initial logs and subscribe to WebSocket updates
  useEffect(() => {
    const fetchInitialLogs = async () => {
      const data = await api.getLogs();
      if (data) {
        // Sort logs by timestamp descending (newest first)
        const sortedLogs = [...data].sort((a, b) =>
          new Date(b.timestamp) - new Date(a.timestamp)
        );
        setLogs(sortedLogs);
      }
    };

    fetchInitialLogs();

    // Subscribe to real-time log updates via WebSocket
    const unsubscribe = wsManager.subscribe('log', (newLog) => {
      setLogs(prevLogs => {
        // Add new log to the beginning (newest first)
        const updatedLogs = [newLog, ...prevLogs];
        // Keep only the last 500 logs to prevent memory issues
        return updatedLogs.slice(0, 500);
      });
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', { hour12: false });
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'INFO': return '#0f0';
      case 'WARN': return '#ff0';
      case 'ERROR': return '#f00';
      default: return '#fff';
    }
  };

  // Format logs for InfiniteScroll
  const formattedLogItems = logs.map((log, index) => ({
    content: (
      <div className="log-card-content">
        <div className="log-card-header">
          <span className="log-source">{log.source || 'System'}</span>
          <span className="log-timestamp">{formatTimestamp(log.timestamp)}</span>
        </div>
        <div className="log-card-body">
          <span
            className="log-level"
            style={{
              backgroundColor: getLevelColor(log.level) + '33',
              color: getLevelColor(log.level)
            }}
          >
            {log.level}
          </span>
          <span className="log-message">{log.message}</span>
        </div>
      </div>
    )
  }));

  return (
    <div className="log-viewer">
      <GlassSurfaceSimple className="sidebar-glass">
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>Server Logs</h2>
            <label className="view-toggle">
              <input
                type="checkbox"
                checked={viewMode === 'terminal'}
                onChange={handleToggleViewMode}
              />
              <span>Terminal View</span>
            </label>
          </div>

          <div className="log-content" ref={scrollContainerRef}>
            {logs.length === 0 ? (
              <div className="log-empty">
                No logs available. Waiting for server connection...
              </div>
            ) : viewMode === 'terminal' ? (
              <div className="terminal-view">
                {logs.map((log, index) => (
                  <div key={log.id || index} className="terminal-line">
                    <span className="terminal-timestamp">[{formatTimestamp(log.timestamp)}]</span>
                    <span
                      className="terminal-level"
                      style={{ color: getLevelColor(log.level) }}
                    >
                      [{log.level}]
                    </span>
                    <span className="terminal-message">{log.message}</span>
                  </div>
                ))}
              </div>
            ) : (
              <InfiniteScroll
                items={formattedLogItems}
                width="100%"
                maxHeight="100%"
                itemMinHeight={60}
                negativeMargin="0.3rem"
                isTilted={true}
                tiltDirection="right"
                autoplay={false}
                pauseOnHover={true}
              />
            )}
          </div>
        </div>
      </GlassSurfaceSimple>
    </div>
  );
}
