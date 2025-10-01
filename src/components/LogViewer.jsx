import { useState, useRef, useEffect } from 'react';
import GlassSurface from './GlassSurface';
import './LogViewer.css';

export default function LogViewer() {
  const [viewMode, setViewMode] = useState('formatted'); // 'formatted' or 'terminal'
  const [logs, setLogs] = useState([
    { id: 1, timestamp: new Date().toISOString(), level: 'INFO', message: 'Server started successfully', source: 'Console' },
    { id: 2, timestamp: new Date().toISOString(), level: 'INFO', message: 'Player joined: Steve', source: 'Player' },
    { id: 3, timestamp: new Date().toISOString(), level: 'WARN', message: 'Low TPS detected: 15.2', source: 'Monitor' },
    { id: 4, timestamp: new Date().toISOString(), level: 'INFO', message: 'NPC "Shopkeeper Bob" initialized', source: 'NPC' },
    { id: 5, timestamp: new Date().toISOString(), level: 'INFO', message: 'Command executed: /give Steve diamond 1', source: 'Console' },
  ]);
  const scrollContainerRef = useRef(null);

  const handleToggleViewMode = () => {
    setViewMode(prev => prev === 'formatted' ? 'terminal' : 'formatted');
  };

  // Simulate real-time log updates
  useEffect(() => {
    const interval = setInterval(() => {
      const newLog = {
        id: Date.now(),
        timestamp: new Date().toISOString(),
        level: ['INFO', 'WARN', 'ERROR'][Math.floor(Math.random() * 3)],
        message: [
          'Player movement detected',
          'Chunk loaded',
          'Entity spawned',
          'Command executed',
          'Chat message received'
        ][Math.floor(Math.random() * 5)],
        source: ['Console', 'Player', 'NPC', 'System'][Math.floor(Math.random() * 4)]
      };
      setLogs(prev => [...prev, newLog].slice(-100)); // Keep last 100 logs
    }, 3000);

    return () => clearInterval(interval);
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

  return (
    <div className="log-viewer">
      <GlassSurface
        width="100%"
        height="100%"
        borderRadius={16}
        backgroundOpacity={0.1}
        className="sidebar-glass"
      >
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
            {viewMode === 'terminal' ? (
              <div className="terminal-view">
                {logs.map(log => (
                  <div key={log.id} className="terminal-line">
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
              <div className="infinite-scroll-wrapper">
                <div className="infinite-scroll-container">
                  {logs.map((log) => (
                    <div key={log.id} className="infinite-scroll-item log-card">
                      <div className="log-card-header">
                        <span className="log-source">{log.source}</span>
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
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </GlassSurface>
    </div>
  );
}
