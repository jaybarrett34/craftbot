import { useState, useEffect } from 'react';
import GlassSurfaceSimple from './GlassSurfaceSimple';
import { api } from '../services/api';
import './MobSpawner.css';

const MOB_TYPES = [
  { value: 'minecraft:pig', label: 'Pig' },
  { value: 'minecraft:cow', label: 'Cow' },
  { value: 'minecraft:sheep', label: 'Sheep' },
  { value: 'minecraft:chicken', label: 'Chicken' },
  { value: 'minecraft:rabbit', label: 'Rabbit' },
  { value: 'minecraft:horse', label: 'Horse' },
  { value: 'minecraft:donkey', label: 'Donkey' },
  { value: 'minecraft:llama', label: 'Llama' },
  { value: 'minecraft:cat', label: 'Cat' },
  { value: 'minecraft:wolf', label: 'Wolf' },
  { value: 'minecraft:parrot', label: 'Parrot' },
  { value: 'minecraft:villager', label: 'Villager' },
  { value: 'minecraft:zombie', label: 'Zombie' },
  { value: 'minecraft:skeleton', label: 'Skeleton' },
  { value: 'minecraft:creeper', label: 'Creeper' },
  { value: 'minecraft:spider', label: 'Spider' },
  { value: 'minecraft:enderman', label: 'Enderman' },
  { value: 'minecraft:witch', label: 'Witch' },
  { value: 'minecraft:blaze', label: 'Blaze' },
  { value: 'minecraft:ghast', label: 'Ghast' },
  { value: 'minecraft:piglin', label: 'Piglin' },
  { value: 'minecraft:zombified_piglin', label: 'Zombified Piglin' },
];

// Build NBT string - simplified to just use plain name
// Format: {CustomName:'"Name"',Tags:["tag1","tag2"]}
const buildNBTString = (mobName, preset = 'basic') => {
  // Escape quotes in the name
  const safeName = mobName.replace(/"/g, '\\"');
  const safeTag = mobName.replace(/\s+/g, '_');
  
  // Build NBT parts - just use the plain name in quotes
  let parts = [];
  parts.push(`CustomName:'"${safeName}"'`);
  parts.push(`CustomNameVisible:1b`);
  parts.push(`Tags:["AI_Entity","AI_${safeTag}"]`);
  
  // Add preset-specific properties
  switch (preset) {
    case 'invulnerable':
      parts.push('Invulnerable:1b');
      break;
    case 'glowing':
      parts.push('Glowing:1b');
      break;
    case 'persistent':
      parts.push('PersistenceRequired:1b');
      break;
    case 'silent':
      parts.push('Silent:1b');
      break;
    case 'noAI':
      parts.push('NoAI:1b');
      break;
  }
  
  // Return final NBT string
  return `{${parts.join(',')}}`;
};

// NBT Preset options for dropdown
const NBT_PRESET_OPTIONS = [
  { value: 'basic', label: 'Basic (name only)' },
  { value: 'invulnerable', label: 'Invulnerable' },
  { value: 'glowing', label: 'Glowing' },
  { value: 'persistent', label: 'Persistent (won\'t despawn)' },
  { value: 'silent', label: 'Silent (no sounds)' },
  { value: 'noAI', label: 'No AI (statue)' }
];

export default function MobSpawner() {
  const [mobType, setMobType] = useState('minecraft:pig');
  const [mobName, setMobName] = useState('');
  const [llmEnabled, setLlmEnabled] = useState(true);
  const [proximityRequired, setProximityRequired] = useState(true);
  const [maxProximity, setMaxProximity] = useState(10);
  const [permissionLevel, setPermissionLevel] = useState('readonly');
  const [spawning, setSpawning] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [spawnType, setSpawnType] = useState('player'); // 'player' or 'coordinates'
  const [targetPlayer, setTargetPlayer] = useState('');
  const [coordinates, setCoordinates] = useState({ x: 0, y: 64, z: 0 });
  const [advancedMode, setAdvancedMode] = useState(false);
  const [nbtPreset, setNbtPreset] = useState('basic');
  const [customNbt, setCustomNbt] = useState('');
  
  // LLM model selection
  const [availableModels, setAvailableModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState('qwen2.5:14b-instruct');
  const [loadingModels, setLoadingModels] = useState(false);

  // Fetch available models on mount
  useEffect(() => {
    const fetchModels = async () => {
      setLoadingModels(true);
      const result = await api.getOllamaModels();
      if (result.success && result.models.length > 0) {
        setAvailableModels(result.models);
        // Prefer qwen2.5 if available, otherwise use first model
        const preferredModel = result.models.find(m => m.name.includes('qwen'))?.name 
          || result.models[0].name;
        setSelectedModel(preferredModel);
      } else {
        // Fallback to common models (user needs to pull these)
        setAvailableModels([
          { name: 'qwen2.5:14b-instruct' },
          { name: 'mistral' },
          { name: 'llama3.2' }
        ]);
        setSelectedModel('qwen2.5:14b-instruct');
      }
      setLoadingModels(false);
    };
    
    fetchModels();
  }, []);

  const handleSpawn = async () => {
    if (!mobName.trim()) {
      setMessage({ text: 'Please enter a mob name', type: 'error' });
      return;
    }

    setSpawning(true);
    setMessage({ text: '', type: '' });

    try {
      // Step 1: Build NBT data and summon command FIRST (before creating entity object)
      let nbtData;
      let spawnPosition = null;
      
      if (advancedMode && customNbt.trim()) {
        // Use custom NBT from textarea - assume it's already SNBT format
        nbtData = customNbt.trim();
      } else {
        // Build NBT string directly using proper SNBT format
        nbtData = buildNBTString(mobName.trim(), nbtPreset);
      }

      // Log NBT for debugging
      console.log('[MobSpawner] Generated NBT:', nbtData);

      let summonCommand;
      if (spawnType === 'player') {
        // Spawn at player location
        const target = targetPlayer.trim() || '@p';
        summonCommand = `execute at ${target} run summon ${mobType} ~ ~ ~ ${nbtData}`;
        
        // Try to get player position for tracking
        try {
          const playerInfo = await api.sendCommand(`data get entity ${target} Pos`);
          if (playerInfo && playerInfo.response) {
            const posMatch = playerInfo.response.match(/\[([-\d.]+)d?, ([-\d.]+)d?, ([-\d.]+)d?\]/);
            if (posMatch) {
              spawnPosition = {
                x: parseFloat(posMatch[1]),
                y: parseFloat(posMatch[2]),
                z: parseFloat(posMatch[3])
              };
            }
          }
        } catch (e) {
          console.warn('Could not fetch player position:', e);
        }
      } else {
        // Spawn at specific coordinates
        summonCommand = `summon ${mobType} ${coordinates.x} ${coordinates.y} ${coordinates.z} ${nbtData}`;
        spawnPosition = { x: coordinates.x, y: coordinates.y, z: coordinates.z };
      }

      // Log the exact command for debugging
      console.log('[MobSpawner] Executing summon command:', summonCommand);

      // Step 2: Create entity configuration (NOW that summonCommand and spawnPosition are defined)
      const entity = {
        id: `entity-${Date.now()}`,
        name: mobName.trim(),
        type: 'npc',
        enabled: true,
        permissions: {
          level: permissionLevel,
          whitelistedCommands: [],
          blacklistedCommands: [],
          canExecuteCommands: permissionLevel !== 'readonly'
        },
        knowledge: {
          canAccessPlayerState: [],
          canAccessWorldState: [],
          proximityRequired: proximityRequired,
          maxProximity: maxProximity,
          chatFilters: {
            respondToPlayers: true,
            respondToAI: false,
            requiresMention: false
          }
        },
        personality: {
          characterContext: `You are ${mobName}, a ${mobType.replace('minecraft:', '')} in Minecraft. You are friendly and enjoy interacting with players.`,
          conversationHistoryLimit: 20,
          useSummarization: false
        },
        llm: {
          model: selectedModel,
          temperature: 0.7,
          enabled: llmEnabled
        },
        appearance: {
          spawnCommand: summonCommand,
          chatBubble: true,
          usesServerChat: false,
          position: spawnPosition,
          entityTag: `AI_${mobName.trim().replace(/\s+/g, '_')}`
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

      // Step 3: Add entity to backend
      const entityResult = await api.addEntity(entity);

      if (!entityResult) {
        throw new Error('Failed to create entity configuration');
      }

      // Step 4: Spawn the mob in-game
      const commandResult = await api.sendCommand(summonCommand);

      if (!commandResult) {
        throw new Error('Failed to spawn mob in-game');
      }

      setMessage({
        text: `Successfully spawned ${mobName} as ${mobType.replace('minecraft:', '')}!`,
        type: 'success'
      });

      // Reset form
      setMobName('');

    } catch (error) {
      console.error('Error spawning mob:', error);
      setMessage({
        text: error.message || 'Failed to spawn mob',
        type: 'error'
      });
    } finally {
      setSpawning(false);
    }
  };

  return (
    <div className="mob-spawner">
      <GlassSurfaceSimple className="spawner-glass">
        <div className="spawner-content">
          <h2>Mob Spawner</h2>

          <div className="spawner-form">
            <div className="form-group">
              <label>Mob Type</label>
              <select
                value={mobType}
                onChange={(e) => setMobType(e.target.value)}
                disabled={spawning}
              >
                {MOB_TYPES.map(mob => (
                  <option key={mob.value} value={mob.value}>
                    {mob.label}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Mob Name</label>
              <input
                type="text"
                placeholder="Enter mob name (e.g., 'Steve', 'Bob')"
                value={mobName}
                onChange={(e) => setMobName(e.target.value)}
                disabled={spawning}
                maxLength={32}
              />
              <small className="help-text">
                This will be the AI entity's name
              </small>
            </div>

            <div className="form-section">
              <h4>Spawn Location</h4>

              <div className="form-group">
                <label>Spawn Type</label>
                <select
                  value={spawnType}
                  onChange={(e) => setSpawnType(e.target.value)}
                  disabled={spawning}
                >
                  <option value="player">At Player</option>
                  <option value="coordinates">At Coordinates</option>
                </select>
              </div>

              {spawnType === 'player' ? (
                <div className="form-group">
                  <label>Target Player</label>
                  <input
                    type="text"
                    placeholder="Player name or @p for nearest"
                    value={targetPlayer}
                    onChange={(e) => setTargetPlayer(e.target.value)}
                    disabled={spawning}
                  />
                  <small className="help-text">
                    Leave empty to spawn at nearest player (@p)
                  </small>
                </div>
              ) : (
                <div className="form-group coordinates-group">
                  <label>Coordinates</label>
                  <div className="coordinates-inputs">
                    <div className="coordinate-input">
                      <label>X</label>
                      <input
                        type="number"
                        value={coordinates.x}
                        onChange={(e) => setCoordinates({ ...coordinates, x: parseInt(e.target.value) || 0 })}
                        disabled={spawning}
                      />
                    </div>
                    <div className="coordinate-input">
                      <label>Y</label>
                      <input
                        type="number"
                        value={coordinates.y}
                        onChange={(e) => setCoordinates({ ...coordinates, y: parseInt(e.target.value) || 0 })}
                        disabled={spawning}
                      />
                    </div>
                    <div className="coordinate-input">
                      <label>Z</label>
                      <input
                        type="number"
                        value={coordinates.z}
                        onChange={(e) => setCoordinates({ ...coordinates, z: parseInt(e.target.value) || 0 })}
                        disabled={spawning}
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>NBT Configuration</h4>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={advancedMode}
                    onChange={(e) => {
                      setAdvancedMode(e.target.checked);
                      if (e.target.checked && !customNbt) {
                        // Populate textarea with current preset
                        const nbtObject = NBT_PRESETS[nbtPreset](mobName || 'MobName');
                        setCustomNbt(JSON.stringify(nbtObject, null, 2));
                      }
                    }}
                    disabled={spawning}
                  />
                  Advanced NBT Editor
                </label>
                <small className="help-text">
                  Manually edit the NBT JSON for full control
                </small>
              </div>

              {!advancedMode ? (
                <div className="form-group">
                  <label>NBT Preset</label>
                  <select
                    value={nbtPreset}
                    onChange={(e) => setNbtPreset(e.target.value)}
                    disabled={spawning}
                  >
                    <option value="basic">Basic (Custom Name)</option>
                    <option value="invulnerable">Invulnerable</option>
                    <option value="glowing">Glowing</option>
                    <option value="persistent">Persistent (No Despawn)</option>
                    <option value="silent">Silent</option>
                    <option value="noAI">No AI (Statue)</option>
                  </select>
                  <small className="help-text">
                    Pre-configured NBT templates for common use cases
                  </small>
                </div>
              ) : (
                <div className="form-group">
                  <label>Custom NBT JSON</label>
                  <textarea
                    className="nbt-editor"
                    value={customNbt}
                    onChange={(e) => setCustomNbt(e.target.value)}
                    disabled={spawning}
                    placeholder='{"CustomName":"[{\\"text\\":\\"[AI] \\",\\"color\\":\\"aqua\\"},{\\"text\\":\\"MobName\\"}]"}'
                    rows={8}
                  />
                  <small className="help-text">
                    Enter valid NBT JSON. Will be validated before spawning.
                  </small>
                  <button
                    type="button"
                    className="format-json-btn"
                    onClick={() => {
                      try {
                        const formatted = JSON.stringify(JSON.parse(customNbt), null, 2);
                        setCustomNbt(formatted);
                      } catch (e) {
                        setMessage({ text: 'Invalid JSON format', type: 'error' });
                      }
                    }}
                    disabled={spawning}
                  >
                    Format JSON
                  </button>
                </div>
              )}
            </div>

            <div className="form-section">
              <h4>AI Configuration</h4>

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={llmEnabled}
                    onChange={(e) => setLlmEnabled(e.target.checked)}
                    disabled={spawning}
                  />
                  Enable LLM
                </label>
                <small className="help-text">
                  Allow this mob to use AI responses
                </small>
              </div>

              {llmEnabled && (
                <div className="form-group">
                  <label>LLM Model</label>
                  <select
                    value={selectedModel}
                    onChange={(e) => setSelectedModel(e.target.value)}
                    disabled={spawning || loadingModels}
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
                    Select which Ollama model this mob will use
                  </small>
                </div>
              )}

              <div className="form-group">
                <label className="checkbox-label">
                  <input
                    type="checkbox"
                    checked={proximityRequired}
                    onChange={(e) => setProximityRequired(e.target.checked)}
                    disabled={spawning}
                  />
                  Proximity Required
                </label>
                <small className="help-text">
                  Entity only perceives nearby events and players
                </small>
              </div>

              {proximityRequired && (
                <div className="form-group">
                  <label>Max Proximity (blocks)</label>
                  <input
                    type="range"
                    min="5"
                    max="100"
                    value={maxProximity}
                    onChange={(e) => setMaxProximity(parseInt(e.target.value))}
                    disabled={spawning}
                  />
                  <span className="range-value">{maxProximity} blocks</span>
                </div>
              )}

              <div className="form-group">
                <label>Permission Level</label>
                <select
                  value={permissionLevel}
                  onChange={(e) => setPermissionLevel(e.target.value)}
                  disabled={spawning}
                >
                  <option value="readonly">Read Only</option>
                  <option value="restricted">Restricted</option>
                  <option value="moderate">Moderate</option>
                  <option value="elevated">Elevated</option>
                  <option value="admin">Admin</option>
                </select>
                <small className="help-text">
                  Controls what commands this mob can execute
                </small>
              </div>
            </div>

            {message.text && (
              <div className={`spawn-message spawn-message--${message.type}`}>
                {message.text}
              </div>
            )}

            <button
              className="spawn-button"
              onClick={handleSpawn}
              disabled={spawning || !mobName.trim()}
            >
              {spawning ? 'Spawning...' : 'Spawn Mob'}
            </button>
          </div>
        </div>
      </GlassSurfaceSimple>
    </div>
  );
}
