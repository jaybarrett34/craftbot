import { useState, useEffect } from 'react';
import GlassSurfaceSimple from './GlassSurfaceSimple';
import { api } from '../services/api';
import './ModelDiagnostics.css';

export default function ModelDiagnostics() {
  const [models, setModels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [health, setHealth] = useState({ available: false });
  const [error, setError] = useState('');
  const [refreshing, setRefreshing] = useState(false);

  const fetchModels = async () => {
    setRefreshing(true);
    setError('');

    try {
      // Check Ollama health first
      const healthResult = await api.getOllamaHealth();
      setHealth(healthResult);

      if (!healthResult.available) {
        setError('Ollama is not available. Make sure Ollama is running on http://localhost:11434');
        setModels([]);
        return;
      }

      // Fetch models
      const result = await api.getOllamaModels();
      
      if (result.success) {
        setModels(result.models);
        if (result.models.length === 0) {
          setError('No models found. Pull a model using: ollama pull <model-name>');
        }
      } else {
        setError(result.error || 'Failed to fetch models');
        setModels([]);
      }
    } catch (err) {
      setError(err.message || 'An error occurred while fetching models');
      setModels([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, []);

  const formatBytes = (bytes) => {
    if (!bytes) return 'N/A';
    const gb = bytes / (1024 ** 3);
    return `${gb.toFixed(2)} GB`;
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  return (
    <div className="model-diagnostics">
      <GlassSurfaceSimple className="diagnostics-glass">
        <div className="diagnostics-content">
          <div className="diagnostics-header">
            <h2>Ollama Model Diagnostics</h2>
            <button
              className="refresh-button"
              onClick={fetchModels}
              disabled={refreshing}
            >
              {refreshing ? '↻ Refreshing...' : '↻ Refresh'}
            </button>
          </div>

          {/* Health Status */}
          <div className="health-status">
            <div className="status-item">
              <span className="status-label">Status:</span>
              <span className={`status-indicator ${health.available ? 'status-online' : 'status-offline'}`}>
                {health.available ? '● Online' : '○ Offline'}
              </span>
            </div>
            <div className="status-item">
              <span className="status-label">Models Available:</span>
              <span className="status-value">{models.length}</span>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="diagnostics-error">
              <strong>⚠ Error:</strong> {error}
            </div>
          )}

          {/* Loading State */}
          {loading && !error && (
            <div className="diagnostics-loading">
              Loading models...
            </div>
          )}

          {/* Models List */}
          {!loading && models.length > 0 && (
            <div className="models-list">
              <h3>Available Models</h3>
              <div className="models-grid">
                {models.map((model, index) => (
                  <div key={index} className="model-card">
                    <div className="model-header">
                      <h4 className="model-name">{model.name}</h4>
                      <span className="model-size">{formatBytes(model.size)}</span>
                    </div>
                    <div className="model-details">
                      {model.details && (
                        <>
                          {model.details.parameter_size && (
                            <div className="detail-item">
                              <span className="detail-label">Parameters:</span>
                              <span className="detail-value">{model.details.parameter_size}</span>
                            </div>
                          )}
                          {model.details.quantization_level && (
                            <div className="detail-item">
                              <span className="detail-label">Quantization:</span>
                              <span className="detail-value">{model.details.quantization_level}</span>
                            </div>
                          )}
                          {model.details.family && (
                            <div className="detail-item">
                              <span className="detail-label">Family:</span>
                              <span className="detail-value">{model.details.family}</span>
                            </div>
                          )}
                        </>
                      )}
                      {model.modified_at && (
                        <div className="detail-item">
                          <span className="detail-label">Modified:</span>
                          <span className="detail-value">{formatDate(model.modified_at)}</span>
                        </div>
                      )}
                    </div>
                    <div className="model-id">
                      <small>Digest: {model.digest?.substring(0, 16)}...</small>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Help Text */}
          <div className="diagnostics-help">
            <h4>Need more models?</h4>
            <p>Install models using the Ollama CLI:</p>
            <code>ollama pull llama2</code>
            <code>ollama pull mistral</code>
            <code>ollama pull qwen2.5:14b-instruct</code>
            <p>
              <a href="https://ollama.com/library" target="_blank" rel="noopener noreferrer">
                Browse available models →
              </a>
            </p>
          </div>
        </div>
      </GlassSurfaceSimple>
    </div>
  );
}

