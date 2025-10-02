import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Ollama Logger
 * 
 * Logs ALL Ollama interactions to a separate file for debugging
 */
class OllamaLogger {
  constructor() {
    this.logPath = path.join(__dirname, '..', 'ollama-log.txt');
    this.enabled = true;
    
    // Initialize log file
    this.log('='.repeat(80));
    this.log(`Ollama Logger Started: ${new Date().toISOString()}`);
    this.log('='.repeat(80));
  }

  log(message) {
    if (!this.enabled) return;
    
    const timestamp = new Date().toISOString();
    const logLine = `[${timestamp}] ${message}\n`;
    
    try {
      fs.appendFileSync(this.logPath, logLine);
    } catch (error) {
      console.error('[OllamaLogger] Failed to write to log:', error.message);
    }
  }

  logRequest(entity, messages, options) {
    this.log('');
    this.log('─'.repeat(80));
    this.log(`REQUEST: ${entity.name}`);
    this.log('─'.repeat(80));
    this.log(`Entity ID: ${entity.id}`);
    this.log(`Model: ${options.model || 'default'}`);
    this.log(`Temperature: ${options.temperature}`);
    this.log('');
    this.log('MESSAGES:');
    messages.forEach((msg, idx) => {
      this.log(`  [${idx}] ${msg.role}:`);
      this.log(`      ${msg.content.substring(0, 200)}${msg.content.length > 200 ? '...' : ''}`);
    });
    this.log('');
  }

  logResponse(entity, response, durationMs) {
    this.log('─'.repeat(80));
    this.log(`RESPONSE: ${entity.name} (${durationMs}ms)`);
    this.log('─'.repeat(80));
    
    if (response.success) {
      this.log('Status: ✅ SUCCESS');
      this.log('');
      this.log('RAW RESPONSE:');
      this.log(response.message?.content || 'No content');
      this.log('');
    } else {
      this.log('Status: ❌ ERROR');
      this.log(`Error: ${response.error}`);
      this.log('');
    }
  }

  logParsed(entity, parsed) {
    this.log('─'.repeat(80));
    this.log(`PARSED: ${entity.name}`);
    this.log('─'.repeat(80));
    
    if (parsed.thoughts && parsed.thoughts.length > 0) {
      this.log('THOUGHTS:');
      parsed.thoughts.forEach((thought, idx) => {
        this.log(`  [${idx}] ${thought}`);
      });
      this.log('');
    }
    
    if (parsed.action !== undefined) {
      this.log(`ACTION: ${parsed.action} (${parsed.action === 0 ? 'SUPPRESS SPEECH' : 'ALLOW SPEECH'})`);
      this.log('');
    }
    
    if (parsed.commands && parsed.commands.length > 0) {
      this.log('COMMANDS:');
      parsed.commands.forEach((cmd, idx) => {
        this.log(`  [${idx}] ${cmd.command}`);
      });
      this.log('');
    }
    
    if (parsed.chat && parsed.chat.length > 0) {
      this.log('CHAT:');
      parsed.chat.forEach((msg, idx) => {
        this.log(`  [${idx}] ${msg}`);
      });
      this.log('');
    }
    
    if (parsed.silence) {
      this.log('SILENCE: Entity chose not to respond');
      this.log('');
    }
  }

  logFeedback(entity, chatMessage) {
    this.log('─'.repeat(80));
    this.log(`FEEDBACK LOOP: ${entity.name} → Chat Monitor`);
    this.log('─'.repeat(80));
    this.log(`Message: [AI] <${entity.name}> ${chatMessage}`);
    this.log('Will be re-injected for other AI entities to hear');
    this.log('');
  }

  logError(entity, error) {
    this.log('═'.repeat(80));
    this.log(`ERROR: ${entity.name}`);
    this.log('═'.repeat(80));
    this.log(error.stack || error.message);
    this.log('');
  }

  separator() {
    this.log('═'.repeat(80));
    this.log('');
  }
}

// Export singleton
export const ollamaLogger = new OllamaLogger();

