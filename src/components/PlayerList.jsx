import { useState, useEffect } from 'react';
import { wsManager } from '../services/api';
import GlassSurface from './GlassSurface';
import GlitchText from './GlitchText';
import './PlayerList.css';

export default function PlayerList() {
  const [playerData, setPlayerData] = useState({
    count: 0,
    players: [],
    timestamp: null
  });

  useEffect(() => {
    const unsubscribe = wsManager.subscribe('players', (data) => {
      setPlayerData(data);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="player-list-container">
      <GlassSurface
        width="100%"
        height="auto"
        borderRadius={12}
        brightness={45}
        opacity={0.88}
        blur={8}
        displace={0.5}
        distortionScale={-140}
        className="player-list-surface"
      >
        <div className="player-list">
          <div className="player-list-header">
            <GlitchText
              speed={0.8}
              enableShadows={true}
              enableOnHover={false}
              className="player-list-title minecraft-font"
            >
              PLAYERS ONLINE
            </GlitchText>
            <div className="player-count">
              <span className="count-value">{playerData.count}</span>
            </div>
          </div>

          <div className="player-list-content">
            {playerData.count === 0 ? (
              <div className="no-players">
                <span className="no-players-text">No players online</span>
              </div>
            ) : (
              <ul className="players-list">
                {playerData.players.map((player, index) => (
                  <li
                    key={`${player}-${index}`}
                    className="player-item"
                    style={{
                      animationDelay: `${index * 0.05}s`
                    }}
                  >
                    <span className="player-indicator"></span>
                    <span className="player-name">{player}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {playerData.timestamp && (
            <div className="player-list-footer">
              <span className="last-updated">
                Last updated: {new Date(playerData.timestamp).toLocaleTimeString()}
              </span>
            </div>
          )}
        </div>
      </GlassSurface>
    </div>
  );
}
