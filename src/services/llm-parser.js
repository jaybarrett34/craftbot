/**
 * LLM Response Parser
 *
 * Parses XML-tagged responses from LLM into structured data for:
 * - <thinking>: Internal reasoning (not displayed)
 * - <say>: Speech output (displayed in chat/bubble)
 * - <function>: Minecraft commands to execute
 * - <silence>: Explicit choice not to speak
 */

class LLMParser {
  constructor() {
    // Regex patterns for extracting XML tags
    // Non-greedy matching with dotall support for multiline content
    this.patterns = {
      thinking: /<thinking>([\s\S]*?)<\/thinking>/gi,
      say: /<say>([\s\S]*?)<\/say>/gi,
      function: /<function>([\s\S]*?)<\/function>/gi,
      silence: /<silence\s*\/?>/gi
    };
  }

  /**
   * Parse LLM response and extract all tagged sections
   * @param {string} response - Raw LLM response text
   * @returns {Object} Parsed response with arrays for each tag type
   */
  parse(response) {
    if (!response || typeof response !== 'string') {
      return this.createEmptyResponse();
    }

    const result = {
      thinking: [],
      say: [],
      functions: [],
      silence: false,
      raw: response,
      hasValidTags: false
    };

    try {
      // Extract thinking blocks
      result.thinking = this.extractMatches(response, this.patterns.thinking);

      // Extract say blocks
      result.say = this.extractMatches(response, this.patterns.say);

      // Extract function blocks
      result.functions = this.extractMatches(response, this.patterns.function);

      // Check for silence tag
      result.silence = this.patterns.silence.test(response);

      // Determine if response has valid tags
      result.hasValidTags = result.thinking.length > 0 ||
                            result.say.length > 0 ||
                            result.functions.length > 0 ||
                            result.silence;

      // If no valid tags found, treat entire response as say content
      if (!result.hasValidTags) {
        result.say.push(response.trim());
        result.hasValidTags = true;
      }

    } catch (error) {
      console.error('Error parsing LLM response:', error);
      // On error, treat as plain say message
      result.say.push(response.trim());
      result.hasValidTags = true;
    }

    return result;
  }

  /**
   * Extract all matches for a given pattern
   * @param {string} text - Text to search
   * @param {RegExp} pattern - Regex pattern to match
   * @returns {Array<string>} Array of matched content (without tags)
   */
  extractMatches(text, pattern) {
    const matches = [];
    let match;

    // Reset regex state
    pattern.lastIndex = 0;

    while ((match = pattern.exec(text)) !== null) {
      const content = match[1]?.trim();
      if (content) {
        matches.push(content);
      }
    }

    return matches;
  }

  /**
   * Parse function calls into structured commands
   * @param {Array<string>} functionBlocks - Array of function content strings
   * @returns {Array<Object>} Array of command objects
   */
  parseFunctions(functionBlocks) {
    return functionBlocks.map((func, index) => {
      const trimmed = func.trim();

      // Try to parse as JSON for complex commands
      try {
        const parsed = JSON.parse(trimmed);
        return {
          type: 'json',
          command: parsed.command || parsed,
          params: parsed.params || {},
          index
        };
      } catch {
        // Treat as plain command string
        return {
          type: 'plain',
          command: trimmed,
          index
        };
      }
    });
  }

  /**
   * Validate if a response should trigger an action
   * @param {Object} parsed - Parsed response object
   * @returns {boolean} True if response has actionable content
   */
  hasActionableContent(parsed) {
    return parsed.say.length > 0 ||
           parsed.functions.length > 0 ||
           parsed.silence;
  }

  /**
   * Get primary say message (first one)
   * @param {Object} parsed - Parsed response object
   * @returns {string|null} First say message or null
   */
  getPrimarySayMessage(parsed) {
    return parsed.say.length > 0 ? parsed.say[0] : null;
  }

  /**
   * Get all say messages joined
   * @param {Object} parsed - Parsed response object
   * @param {string} separator - Separator between messages
   * @returns {string} Joined say messages
   */
  getAllSayMessages(parsed, separator = ' ') {
    return parsed.say.join(separator);
  }

  /**
   * Create empty response structure
   * @returns {Object} Empty parsed response
   */
  createEmptyResponse() {
    return {
      thinking: [],
      say: [],
      functions: [],
      silence: false,
      raw: '',
      hasValidTags: false
    };
  }

  /**
   * Sanitize message for Minecraft chat (remove problematic characters)
   * @param {string} message - Message to sanitize
   * @returns {string} Sanitized message
   */
  sanitizeForMinecraft(message) {
    if (!message) return '';

    return message
      .replace(/[^\x20-\x7E\n]/g, '') // Remove non-printable ASCII
      .replace(/\n{3,}/g, '\n\n')     // Max 2 consecutive newlines
      .trim()
      .substring(0, 256);              // Minecraft chat limit
  }

  /**
   * Format parsed response for logging/debugging
   * @param {Object} parsed - Parsed response object
   * @returns {string} Formatted string
   */
  formatForLogging(parsed) {
    const parts = [];

    if (parsed.thinking.length > 0) {
      parts.push(`THINKING: ${parsed.thinking.length} block(s)`);
    }

    if (parsed.say.length > 0) {
      parts.push(`SAY: "${parsed.say.join(', ')}"`);
    }

    if (parsed.functions.length > 0) {
      parts.push(`FUNCTIONS: ${parsed.functions.length} command(s)`);
    }

    if (parsed.silence) {
      parts.push('SILENCE');
    }

    return parts.join(' | ') || 'EMPTY';
  }
}

// Export singleton instance
export default new LLMParser();
