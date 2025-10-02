import { useState, useEffect } from 'react';
import { api } from '../services/api';
import './CommandValidator.css';

export default function CommandValidator({ entity }) {
  const [command, setCommand] = useState('');
  const [validationResult, setValidationResult] = useState(null);
  const [isValidating, setIsValidating] = useState(false);

  useEffect(() => {
    // Clear validation when entity changes
    setValidationResult(null);
    setCommand('');
  }, [entity?.id]);

  const handleValidate = async () => {
    if (!command.trim() || !entity) return;

    setIsValidating(true);
    try {
      const result = await api.validateCommand(command.trim(), entity.id);
      setValidationResult(result);
    } catch (error) {
      setValidationResult({
        allowed: false,
        reason: 'Validation failed: ' + error.message
      });
    } finally {
      setIsValidating(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleValidate();
    }
  };

  const getStatusClass = () => {
    if (!validationResult) return '';
    return validationResult.allowed ? 'allowed' : 'denied';
  };

  const getStatusIcon = () => {
    if (!validationResult) return '';
    return validationResult.allowed ? '✓' : '✗';
  };

  return (
    <div className="command-validator">
      <h4>Test Command Permissions</h4>
      <div className="validator-input-group">
        <input
          type="text"
          className="validator-input"
          placeholder="Enter command to test (e.g., 'time set day')"
          value={command}
          onChange={(e) => setCommand(e.target.value)}
          onKeyPress={handleKeyPress}
          disabled={isValidating || !entity}
        />
        <button
          className="btn-validate"
          onClick={handleValidate}
          disabled={!command.trim() || isValidating || !entity}
        >
          {isValidating ? 'Validating...' : 'Test'}
        </button>
      </div>

      {validationResult && (
        <div className={`validation-result ${getStatusClass()}`}>
          <div className="result-header">
            <span className="result-icon">{getStatusIcon()}</span>
            <span className="result-status">
              {validationResult.allowed ? 'Command Allowed' : 'Command Denied'}
            </span>
          </div>
          <div className="result-details">
            <div className="result-row">
              <span className="result-label">Command:</span>
              <code className="result-value">{command}</code>
            </div>
            <div className="result-row">
              <span className="result-label">Entity:</span>
              <span className="result-value">{entity.name}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Permission Level:</span>
              <span className="result-value">{entity.permissions.level}</span>
            </div>
            <div className="result-row">
              <span className="result-label">Reason:</span>
              <span className="result-value">{validationResult.reason}</span>
            </div>
            {validationResult.matchedRule && (
              <div className="result-row">
                <span className="result-label">Matched Rule:</span>
                <span className="result-value">{validationResult.matchedRule}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {!entity && (
        <div className="validator-notice">
          Select an entity to test command permissions
        </div>
      )}
    </div>
  );
}
