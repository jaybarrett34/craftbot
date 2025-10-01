import { useState, useEffect } from 'react';
import GlassSurfaceSimple from './GlassSurfaceSimple';
import './EntityConfigSidebar.css';

export default function EntityConfigSidebar({ config, onConfigChange }) {
  const [viewMode, setViewMode] = useState('pretty'); // 'pretty' or 'json'
  const [selectedEntityId, setSelectedEntityId] = useState(config.entities[0]?.id || null);

  const selectedEntity = config.entities.find(e => e.id === selectedEntityId);

  const handleToggleViewMode = () => {
    setViewMode(prev => prev === 'pretty' ? 'json' : 'pretty');
  };

  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState(null);

  // Sync jsonText when config changes from outside
  useEffect(() => {
    setJsonText(JSON.stringify(config, null, 2));
  }, [config]);

  const handleJsonChange = (e) => {
    const newText = e.target.value;
    setJsonText(newText);

    try {
      const parsed = JSON.parse(newText);
      setJsonError(null);
      onConfigChange(parsed);
    } catch (err) {
      setJsonError(err.message);
      // Don't update config if invalid
    }
  };

  const handleAddEntity = () => {
    const newEntity = {
      id: `entity-${Date.now()}`,
      name: "New Entity",
      type: "npc",
      enabled: false,
      permissions: {
        canExecuteCommands: false,
        allowedCommands: [],
        deniedCommands: [],
        accessLevel: "user"
      },
      context: {
        systemPrompt: "",
        worldState: {
          canSeeNearbyPlayers: true,
          canSeeNearbyNPCs: false,
          canSeeNearbyMobs: false,
          perceptionRadius: 10
        }
      },
      llm: {
        model: "llama2",
        temperature: 0.7,
        enabled: false
      },
      mcpTools: {
        minecraft_send_message: false,
        minecraft_run_command: false,
        minecraft_get_chat_history: false,
        minecraft_search_history: false,
        minecraft_get_player_info: false,
        minecraft_get_server_status: false
      }
    };

    onConfigChange({
      ...config,
      entities: [...config.entities, newEntity]
    });
    setSelectedEntityId(newEntity.id);
  };

  const handleRemoveEntity = (id) => {
    const newEntities = config.entities.filter(e => e.id !== id);
    onConfigChange({
      ...config,
      entities: newEntities
    });
    if (selectedEntityId === id) {
      setSelectedEntityId(newEntities[0]?.id || null);
    }
  };

  const handleEntityFieldChange = (field, value) => {
    const newEntities = config.entities.map(e => {
      if (e.id === selectedEntityId) {
        return { ...e, [field]: value };
      }
      return e;
    });
    onConfigChange({
      ...config,
      entities: newEntities
    });
  };

  const handleNestedFieldChange = (path, value) => {
    const newEntities = config.entities.map(e => {
      if (e.id === selectedEntityId) {
        const updated = { ...e };
        const keys = path.split('.');
        let current = updated;
        for (let i = 0; i < keys.length - 1; i++) {
          current[keys[i]] = { ...current[keys[i]] };
          current = current[keys[i]];
        }
        current[keys[keys.length - 1]] = value;
        return updated;
      }
      return e;
    });
    onConfigChange({
      ...config,
      entities: newEntities
    });
  };

  return (
    <div className="entity-config-sidebar">
      <GlassSurfaceSimple className="sidebar-glass">
        <div className="sidebar-content">
          <div className="sidebar-header">
            <h2>Entity Config</h2>
            <label className="view-toggle">
              <input
                type="checkbox"
                checked={viewMode === 'json'}
                onChange={handleToggleViewMode}
              />
              <span>Raw JSON</span>
            </label>
          </div>

          {viewMode === 'json' ? (
            <div className="json-editor-container">
              {jsonError && <div className="json-error">{jsonError}</div>}
              <textarea
                className="json-editor"
                value={jsonText}
                onChange={handleJsonChange}
                spellCheck={false}
              />
            </div>
          ) : (
            <>
              <div className="entity-list">
                <div className="entity-list-header">
                  <h3>Entities</h3>
                  <button onClick={handleAddEntity} className="btn-add">+</button>
                </div>
                {config.entities.map(entity => (
                  <div
                    key={entity.id}
                    className={`entity-item ${selectedEntityId === entity.id ? 'active' : ''}`}
                    onClick={() => setSelectedEntityId(entity.id)}
                  >
                    <span className={`entity-status ${entity.enabled ? 'enabled' : 'disabled'}`}></span>
                    <span className="entity-name">{entity.name}</span>
                    <span className="entity-type">{entity.type}</span>
                    {entity.type !== 'console' && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveEntity(entity.id);
                        }}
                        className="btn-remove"
                      >
                        ×
                      </button>
                    )}
                  </div>
                ))}
              </div>

              {selectedEntity && (
                <div className="entity-details">
                  <h3>Entity Details</h3>

                  <div className="form-group">
                    <label>Name</label>
                    <input
                      type="text"
                      value={selectedEntity.name}
                      onChange={(e) => handleEntityFieldChange('name', e.target.value)}
                    />
                  </div>

                  <div className="form-group">
                    <label>
                      <input
                        type="checkbox"
                        checked={selectedEntity.enabled}
                        onChange={(e) => handleEntityFieldChange('enabled', e.target.checked)}
                      />
                      Enabled
                    </label>
                  </div>

                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={selectedEntity.type}
                      onChange={(e) => handleEntityFieldChange('type', e.target.value)}
                      disabled={selectedEntity.id === 'console'}
                    >
                      <option value="console">Console</option>
                      <option value="npc">NPC</option>
                      <option value="player">Player</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Access Level</label>
                    <select
                      value={selectedEntity.permissions.accessLevel}
                      onChange={(e) => handleNestedFieldChange('permissions.accessLevel', e.target.value)}
                    >
                      <option value="readonly">Read Only</option>
                      <option value="user">User</option>
                      <option value="mod">Moderator</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label>System Prompt</label>
                    <textarea
                      value={selectedEntity.context.systemPrompt}
                      onChange={(e) => handleNestedFieldChange('context.systemPrompt', e.target.value)}
                      rows={4}
                    />
                  </div>

                  <div className="form-group">
                    <label>Perception Radius</label>
                    <input
                      type="number"
                      value={selectedEntity.context.worldState.perceptionRadius}
                      onChange={(e) => handleNestedFieldChange('context.worldState.perceptionRadius', parseInt(e.target.value))}
                    />
                  </div>

                  <div className="form-section">
                    <h4>MCP Tools</h4>
                    {Object.entries(selectedEntity.mcpTools).map(([tool, enabled]) => (
                      <label key={tool} className="checkbox-label">
                        <input
                          type="checkbox"
                          checked={enabled}
                          onChange={(e) => handleNestedFieldChange(`mcpTools.${tool}`, e.target.checked)}
                        />
                        {tool.replace('minecraft_', '').replace(/_/g, ' ')}
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </GlassSurfaceSimple>
    </div>
  );
}
