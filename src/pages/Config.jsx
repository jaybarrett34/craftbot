import { useState, useEffect } from 'react';
import LiquidEther from '../components/LiquidEther';
import GlitchText from '../components/GlitchText';
import EntityConfigSidebar from '../components/EntityConfigSidebar';
import LogViewer from '../components/LogViewer';
import ConnectionStatus from '../components/ConnectionStatus';
import MobSpawner from '../components/MobSpawner';
import ModelDiagnostics from '../components/ModelDiagnostics';
import PlayerList from '../components/PlayerList';
import { defaultConfig } from '../config/defaultConfig';
import { api, wsManager } from '../services/api';
import './Config.css';

export default function Config() {
  const [config, setConfig] = useState(defaultConfig);

  // Fetch entities from backend on mount
  useEffect(() => {
    const fetchEntities = async () => {
      const entities = await api.getEntities();
      if (entities && entities.length > 0) {
        setConfig(prevConfig => ({
          ...prevConfig,
          entities
        }));
      }
    };

    fetchEntities();

    // Subscribe to WebSocket updates for entities
    const unsubscribe = wsManager.subscribe('entities', (entities) => {
      setConfig(prevConfig => ({
        ...prevConfig,
        entities
      }));
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return (
    <div className="config-page">
      <div className="config-background">
        <LiquidEther
          colors={['#5227FF', '#FF9FFC', '#B19EEF']}
          mouseForce={20}
          cursorSize={100}
          isViscous={false}
          viscous={30}
          iterationsViscous={32}
          iterationsPoisson={32}
          resolution={0.5}
          isBounce={false}
          autoDemo={true}
          autoSpeed={0.5}
          autoIntensity={2.2}
          takeoverDuration={0.25}
          autoResumeDelay={3000}
          autoRampDuration={0.6}
        />
      </div>

      <ConnectionStatus />

      <div className="config-content">
        <div className="config-header">
          <GlitchText
            speed={1}
            enableShadows={true}
            enableOnHover={false}
            className="config-title minecraft-font"
          >
            CRAFTBOT CONFIG
          </GlitchText>
        </div>

        <div className="config-main">
          <EntityConfigSidebar config={config} onConfigChange={setConfig} />
          <div className="config-center">
            <div className="config-center-content">
              <PlayerList />
              <MobSpawner />
              <ModelDiagnostics />
            </div>
          </div>
          <LogViewer />
        </div>
      </div>
    </div>
  );
}
