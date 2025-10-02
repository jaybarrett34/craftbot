import { useState, useEffect } from 'react';
import GlassSurfaceSimple from './GlassSurfaceSimple';
import CommandValidator from './CommandValidator';
import { permissionLevels, playerStateFields, worldStateFields } from '../config/defaultConfig';
import { api } from '../services/api';
import './EntityConfigSidebar.css';

export default function EntityConfigSidebar({ config, onConfigChange }) {
  const [viewMode, setViewMode] = useState('pretty'); // 'pretty' or 'json'
  const [selectedEntityId, setSelectedEntityId] = useState(config.entities[0]?.id || null);
  const [availableModels, setAvailableModels] = useState([]);
  const [loadingModels, setLoadingModels] = useState(false);

  const selectedEntity = config.entities.find(e => e.id === selectedEntityId);

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      const result = await api.getOllamaModels();
      if (result.success && result.models.length > 0) {
        setAvailableModels(result.models);
      } else {
        // Fallback to common models (user needs to pull these)
        setAvailableModels([
          { name: 'qwen2.5:14b-instruct' },
          { name: 'mistral' },
          { name: 'llama3.2' }
        ]);
      }
      setLoadingModels(false);
    };
    
    fetchModels();
  }, []);

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

  const handleAddEntity = async () => {
    // Get default model from available models (first one, or qwen if available)
    const defaultModel = availableModels.find(m => m.name.includes('qwen'))?.name 
      || availableModels[0]?.name 
      || 'qwen2.5:14b-instruct';

    const newEntity = {
      id: `entity-${Date.now()}`,
      name: "New Entity",
      type: "npc",
      enabled: false,
      permissions: {
        level: "readonly",
        whitelistedCommands: [],
        blacklistedCommands: [],
        canExecuteCommands: false
      },
      knowledge: {
        canAccessPlayerState: [],
        canAccessWorldState: [],
        proximityRequired: true,
        maxProximity: 10,
        chatFilters: {
          respondToPlayers: true,
          respondToAI: false,
          requiresMention: false
        }
      },
      personality: {
        characterContext: "",
        conversationHistoryLimit: 20,
        useSummarization: false
      },
      llm: {
        model: defaultModel,
        temperature: 0.7,
        enabled: false
      },
      appearance: {
        spawnCommand: null,
        chatBubble: true,
        usesServerChat: false
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

    // Send to backend
    const result = await api.addEntity(newEntity);
    if (result) {
      // Update local state optimistically (will also be updated via WebSocket)
      onConfigChange({
        ...config,
        entities: [...config.entities, result]
      });
      setSelectedEntityId(result.id);
    }
  };

  const handleRemoveEntity = async (id) => {
    // Send delete request to backend
    const success = await api.deleteEntity(id);
    if (success) {
      // Update local state optimistically (will also be updated via WebSocket)
      const newEntities = config.entities.filter(e => e.id !== id);
      onConfigChange({
        ...config,
        entities: newEntities
      });
      if (selectedEntityId === id) {
        setSelectedEntityId(newEntities[0]?.id || null);
      }
    }
  };

  const handleEntityFieldChange = async (field, value) => {
    const updatedEntity = { ...selectedEntity, [field]: value };

    // Send update to backend
    const result = await api.updateEntity(selectedEntityId, updatedEntity);
    if (result) {
      // Update local state optimistically (will also be updated via WebSocket)
      const newEntities = config.entities.map(e => {
        if (e.id === selectedEntityId) {
          return result;
        }
        return e;
      });
      onConfigChange({
        ...config,
        entities: newEntities
      });
    }
  };

  const handleNestedFieldChange = async (path, value) => {
    // Create updated entity with nested field change
    const updated = { ...selectedEntity };
    const keys = path.split('.');
    let current = updated;
    for (let i = 0; i < keys.length - 1; i++) {
      current[keys[i]] = { ...current[keys[i]] };
      current = current[keys[i]];
    }
    current[keys[keys.length - 1]] = value;

    // Send update to backend
    const result = await api.updateEntity(selectedEntityId, updated);
    if (result) {
      // Update local state optimistically (will also be updated via WebSocket)
      const newEntities = config.entities.map(e => {
        if (e.id === selectedEntityId) {
          return result;
        }
        return e;
      });
      onConfigChange({
        ...config,
        entities: newEntities
      });
    }
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

                  <div className="form-section">
                    <h4>Permissions</h4>

                    <div className="form-group">
                      <label>Permission Level</label>
                      <select
                        value={selectedEntity.permissions.level}
                        onChange={(e) => handleNestedFieldChange('permissions.level', e.target.value)}
                      >
                        {permissionLevels.map(level => (
                          <option key={level.value} value={level.value}>
                            {level.label}
                          </option>
                        ))}
                      </select>
                      <small className="help-text">
                        {permissionLevels.find(l => l.value === selectedEntity.permissions.level)?.description}
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.permissions.canExecuteCommands}
                          onChange={(e) => handleNestedFieldChange('permissions.canExecuteCommands', e.target.checked)}
                        />
                        Can Execute Commands
                      </label>
                    </div>

                    <div className="form-group">
                      <label>Whitelisted Commands</label>
                      <input
                        type="text"
                        placeholder="Comma-separated (e.g., time, weather, say) or * for all"
                        value={selectedEntity.permissions.whitelistedCommands.join(', ')}
                        onChange={(e) => {
                          const commands = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                          handleNestedFieldChange('permissions.whitelistedCommands', commands);
                        }}
                      />
                      <small className="help-text">
                        Commands this entity is explicitly allowed to use
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Blacklisted Commands</label>
                      <input
                        type="text"
                        placeholder="Comma-separated (e.g., op, deop, stop)"
                        value={selectedEntity.permissions.blacklistedCommands.join(', ')}
                        onChange={(e) => {
                          const commands = e.target.value.split(',').map(c => c.trim()).filter(c => c);
                          handleNestedFieldChange('permissions.blacklistedCommands', commands);
                        }}
                      />
                      <small className="help-text">
                        Commands this entity is explicitly denied from using
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Knowledge & Awareness</h4>

                    <div className="form-group">
                      <label>Player State Access</label>
                      <div className="checkbox-grid">
                        {playerStateFields.map(field => (
                          <label key={field.value} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedEntity.knowledge.canAccessPlayerState.includes(field.value)}
                              onChange={(e) => {
                                const current = selectedEntity.knowledge.canAccessPlayerState;
                                const updated = e.target.checked
                                  ? [...current, field.value]
                                  : current.filter(v => v !== field.value);
                                handleNestedFieldChange('knowledge.canAccessPlayerState', updated);
                              }}
                            />
                            {field.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>World State Access</label>
                      <div className="checkbox-grid">
                        {worldStateFields.map(field => (
                          <label key={field.value} className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={selectedEntity.knowledge.canAccessWorldState.includes(field.value)}
                              onChange={(e) => {
                                const current = selectedEntity.knowledge.canAccessWorldState;
                                const updated = e.target.checked
                                  ? [...current, field.value]
                                  : current.filter(v => v !== field.value);
                                handleNestedFieldChange('knowledge.canAccessWorldState', updated);
                              }}
                            />
                            {field.label}
                          </label>
                        ))}
                      </div>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.knowledge.proximityRequired}
                          onChange={(e) => handleNestedFieldChange('knowledge.proximityRequired', e.target.checked)}
                        />
                        Proximity Required
                      </label>
                      <small className="help-text">
                        Entity only perceives nearby events and players
                      </small>
                    </div>

                    {selectedEntity.knowledge.proximityRequired && (
                      <div className="form-group">
                        <label>Max Proximity (blocks)</label>
                        <input
                          type="range"
                          min="5"
                          max="100"
                          value={selectedEntity.knowledge.maxProximity || 10}
                          onChange={(e) => handleNestedFieldChange('knowledge.maxProximity', parseInt(e.target.value))}
                        />
                        <span className="range-value">{selectedEntity.knowledge.maxProximity || 10} blocks</span>
                      </div>
                    )}

                    <h5>Chat Filters</h5>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.knowledge.chatFilters?.respondToPlayers ?? true}
                          onChange={(e) => handleNestedFieldChange('knowledge.chatFilters.respondToPlayers', e.target.checked)}
                        />
                        Respond to Players
                      </label>
                      <small className="help-text">
                        Entity responds to messages from human players
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.knowledge.chatFilters?.respondToAI ?? false}
                          onChange={(e) => handleNestedFieldChange('knowledge.chatFilters.respondToAI', e.target.checked)}
                        />
                        Respond to AI Entities
                      </label>
                      <small className="help-text">
                        Entity responds to messages from other AI entities
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.knowledge.chatFilters?.requiresMention ?? false}
                          onChange={(e) => handleNestedFieldChange('knowledge.chatFilters.requiresMention', e.target.checked)}
                        />
                        Requires Mention
                      </label>
                      <small className="help-text">
                        Only respond when entity name is mentioned in the message
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Personality</h4>

                    <div className="form-group">
                      <label>Character Description</label>
                      <textarea
                        value={selectedEntity.personality.characterContext || selectedEntity.personality.systemPrompt || ''}
                        onChange={(e) => handleNestedFieldChange('personality.characterContext', e.target.value)}
                        rows={4}
                        placeholder="Define the entity's personality, behavior, and role... (e.g., 'You are a helpful villager who loves to trade')"
                      />
                      <small className="help-text">
                        Describe who this entity is and their personality. Technical XML instructions are added automatically by the backend.
                      </small>
                    </div>

                    <div className="form-group">
                      <label>Conversation History Limit</label>
                      <input
                        type="number"
                        min="5"
                        max="100"
                        value={selectedEntity.personality.conversationHistoryLimit}
                        onChange={(e) => handleNestedFieldChange('personality.conversationHistoryLimit', parseInt(e.target.value))}
                      />
                      <small className="help-text">
                        Number of recent messages to remember
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.personality.useSummarization}
                          onChange={(e) => handleNestedFieldChange('personality.useSummarization', e.target.checked)}
                        />
                        Use Conversation Summarization
                      </label>
                      <small className="help-text">
                        Summarize old conversations to maintain context
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>Appearance & Behavior</h4>

                    <div className="form-group">
                      <label>Spawn Command</label>
                      <input
                        type="text"
                        placeholder="e.g., summon minecraft:villager ~ ~ ~ {CustomName:'...'}"
                        value={selectedEntity.appearance.spawnCommand || ''}
                        onChange={(e) => handleNestedFieldChange('appearance.spawnCommand', e.target.value || null)}
                      />
                      <small className="help-text">
                        Command to spawn this entity (leave empty for console)
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.appearance.chatBubble}
                          onChange={(e) => handleNestedFieldChange('appearance.chatBubble', e.target.checked)}
                        />
                        Use Chat Bubble
                      </label>
                      <small className="help-text">
                        Show messages in floating chat bubble above entity
                      </small>
                    </div>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.appearance.usesServerChat}
                          onChange={(e) => handleNestedFieldChange('appearance.usesServerChat', e.target.checked)}
                        />
                        Use Server Chat
                      </label>
                      <small className="help-text">
                        Send messages to server chat (visible to all players)
                      </small>
                    </div>
                  </div>

                  <div className="form-section">
                    <h4>LLM Configuration</h4>

                    <div className="form-group">
                      <label>
                        <input
                          type="checkbox"
                          checked={selectedEntity.llm.enabled}
                          onChange={(e) => handleNestedFieldChange('llm.enabled', e.target.checked)}
                        />
                        Enable LLM
                      </label>
                    </div>

                    {selectedEntity.llm.enabled && (
                      <>
                        <div className="form-group">
                          <label>Model</label>
                          <select
                            value={selectedEntity.llm.model}
                            onChange={(e) => handleNestedFieldChange('llm.model', e.target.value)}
                            disabled={loadingModels}
                          >
                            {loadingModels ? (
                              <option>Loading models...</option>
                            ) : availableModels.length === 0 ? (
                              <option>No models available</option>
                            ) : (
                              availableModels.map((model) => (
                                <option key={model.name} value={model.name}>
                                  {model.name}
                                  {model.size ? ` (${(model.size / (1024 ** 3)).toFixed(1)} GB)` : ''}
                                </option>
                              ))
                            )}
                          </select>
                          <small className="help-text">
                            Which Ollama model this entity uses
                          </small>
                          {/* Model availability warning */}
                          {!loadingModels && availableModels.length > 0 && 
                           !availableModels.some(m => m.name === selectedEntity.llm.model) && (
                            <div style={{
                              marginTop: '0.5rem',
                              padding: '0.5rem',
                              background: 'rgba(255, 165, 0, 0.1)',
                              border: '1px solid rgba(255, 165, 0, 0.3)',
                              borderRadius: '4px',
                              fontSize: '0.85rem',
                              color: '#ffa500'
                            }}>
                              ⚠️ Model "{selectedEntity.llm.model}" is not available. 
                              <br />
                              Pull it with: <code style={{
                                background: 'rgba(0,0,0,0.3)',
                                padding: '2px 6px',
                                borderRadius: '3px',
                                fontFamily: 'monospace'
                              }}>ollama pull {selectedEntity.llm.model}</code>
                              <br />
                              Or select a different model above.
                            </div>
                          )}
                        </div>

                        <div className="form-group">
                          <label>Temperature</label>
                          <input
                            type="range"
                            min="0"
                            max="2"
                            step="0.1"
                            value={selectedEntity.llm.temperature}
                            onChange={(e) => handleNestedFieldChange('llm.temperature', parseFloat(e.target.value))}
                          />
                          <span className="range-value">{selectedEntity.llm.temperature}</span>
                        </div>
                      </>
                    )}
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

                  <CommandValidator entity={selectedEntity} />
                </div>
              )}
            </>
          )}
        </div>
      </GlassSurfaceSimple>
    </div>
  );
}
