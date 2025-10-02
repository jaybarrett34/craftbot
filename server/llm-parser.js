class LLMParser {
  constructor() {
    // XML-based patterns for LLM responses
    this.xmlPatterns = {
      // <function>command</function> - can be multiline
      functionTag: /<function>([\s\S]*?)<\/function>/gi,
      // <say>message</say> - can be multiline
      sayTag: /<say>([\s\S]*?)<\/say>/gi,
      // <thinking>thoughts</thinking> - can be multiline
      thinkingTag: /<thinking>([\s\S]*?)<\/thinking>/gi,
      // <silence/> - self-closing
      silenceTag: /<silence\s*\/>/gi,
      // <action>0</action> or <action>1</action> - controls speech output
      actionTag: /<action>(0|1)<\/action>/gi
    };

    // Legacy patterns for backwards compatibility
    this.commandPatterns = {
      // /command pattern
      slashCommand: /^\/([a-zA-Z0-9_-]+)\s*(.*?)$/gm,
      // [COMMAND: /command args]
      bracketCommand: /\[COMMAND:\s*\/?(.*?)\]/gi,
      // EXECUTE: /command args
      executeCommand: /EXECUTE:\s*\/?(.*?)$/gim,
      // ```command
      codeBlockCommand: /```(?:minecraft|command)?\s*\n?(\/?.+?)\n?```/gis
    };

    this.chatPattern = /\[CHAT:\s*(.+?)\]/gi;
    this.thoughtPattern = /\[THINK:\s*(.+?)\]/gi;
  }

  parse(llmResponse, options = {}) {
    const strict = options.strict !== undefined ? options.strict : false;

    const result = {
      raw: llmResponse,
      chat: [],
      commands: [],
      thoughts: [],
      silence: false,
      action: 1, // Default to speaking (1)
      actions: []
    };

    if (!llmResponse || typeof llmResponse !== 'string') {
      return result;
    }

    // Check for silence tag first
    if (this.xmlPatterns.silenceTag.test(llmResponse)) {
      result.silence = true;
      return result;
    }

    // Extract action value (0 = don't speak, 1 = speak)
    // Use non-global regex to get capture groups
    const actionRegex = /<action>(0|1)<\/action>/i;
    const actionMatch = llmResponse.match(actionRegex);
    if (actionMatch && actionMatch[1]) {
      result.action = parseInt(actionMatch[1]);
      console.log(`[LLMParser] Action tag detected: ${result.action} (${result.action === 0 ? 'suppress speech' : 'allow speech'})`);
    }

    // Extract thoughts (XML first, then legacy)
    const thoughts = this.extractThoughts(llmResponse);
    result.thoughts = thoughts;

    // Extract commands (XML first, then legacy)
    const commands = this.extractCommands(llmResponse, strict);
    result.commands = commands;

    // Extract chat messages (XML first, then legacy)
    const chat = this.extractChat(llmResponse);
    result.chat = chat;

    // If no explicit chat messages found and not silence, use non-command text as chat
    if (result.chat.length === 0 && !result.silence && !strict) {
      const cleanedText = this.extractImplicitChat(llmResponse, commands);
      if (cleanedText.trim()) {
        result.chat.push(cleanedText.trim());
      }
    }

    // Build actions timeline
    result.actions = this.buildActionsTimeline(llmResponse, result);

    return result;
  }

  extractCommands(text, strict = false) {
    const commands = [];
    const found = new Set(); // Prevent duplicates

    // First, try XML <function> tags (highest priority)
    const functionMatches = [...text.matchAll(this.xmlPatterns.functionTag)];
    for (const match of functionMatches) {
      const content = match[1].trim();
      if (!content) continue;

      // Split by newlines to handle multiple commands in one tag
      const lines = content.split('\n').map(l => l.trim()).filter(l => l);

      for (const line of lines) {
        // Normalize command (ensure leading slash)
        const normalized = line.startsWith('/') ? line : `/${line}`;

        if (!found.has(normalized)) {
          commands.push({
            command: normalized,
            raw: match[0],
            pattern: 'functionTag'
          });
          found.add(normalized);
        }
      }
    }

    // Then try legacy patterns for backwards compatibility
    for (const [patternName, pattern] of Object.entries(this.commandPatterns)) {
      const matches = [...text.matchAll(pattern)];

      for (const match of matches) {
        const command = match[1].trim();

        // Skip empty commands
        if (!command) continue;

        // In strict mode, only accept bracketed or explicit formats
        if (strict && patternName === 'slashCommand') {
          continue;
        }

        // Normalize command (remove leading slash if present)
        const normalized = command.startsWith('/') ? command : `/${command}`;

        if (!found.has(normalized)) {
          commands.push({
            command: normalized,
            raw: match[0],
            pattern: patternName
          });
          found.add(normalized);
        }
      }
    }

    return commands;
  }

  extractChat(text) {
    const chat = [];

    // First, try XML <say> tags (highest priority)
    const sayMatches = [...text.matchAll(this.xmlPatterns.sayTag)];
    for (const match of sayMatches) {
      const message = match[1].trim();
      if (message) {
        chat.push(message);
      }
    }

    // Then try legacy patterns for backwards compatibility
    if (chat.length === 0) {
      const matches = [...text.matchAll(this.chatPattern)];
      for (const match of matches) {
        const message = match[1].trim();
        if (message) {
          chat.push(message);
        }
      }
    }

    return chat;
  }

  extractThoughts(text) {
    const thoughts = [];

    // First, try XML <thinking> tags (highest priority)
    const thinkingMatches = [...text.matchAll(this.xmlPatterns.thinkingTag)];
    for (const match of thinkingMatches) {
      const thought = match[1].trim();
      if (thought) {
        thoughts.push(thought);
      }
    }

    // Then try legacy patterns for backwards compatibility
    if (thoughts.length === 0) {
      const matches = [...text.matchAll(this.thoughtPattern)];
      for (const match of matches) {
        const thought = match[1].trim();
        if (thought) {
          thoughts.push(thought);
        }
      }
    }

    return thoughts;
  }

  extractImplicitChat(text, commands) {
    let cleaned = text;

    // Remove XML tags
    cleaned = cleaned.replace(this.xmlPatterns.thinkingTag, '');
    cleaned = cleaned.replace(this.xmlPatterns.sayTag, '');
    cleaned = cleaned.replace(this.xmlPatterns.functionTag, '');
    cleaned = cleaned.replace(this.xmlPatterns.silenceTag, '');
    cleaned = cleaned.replace(this.xmlPatterns.actionTag, '');

    // Remove thought blocks (legacy)
    cleaned = cleaned.replace(this.thoughtPattern, '');

    // Remove command blocks (legacy)
    cleaned = cleaned.replace(this.commandPatterns.bracketCommand, '');
    cleaned = cleaned.replace(this.commandPatterns.executeCommand, '');
    cleaned = cleaned.replace(this.commandPatterns.codeBlockCommand, '');

    // Remove explicit commands
    for (const cmd of commands) {
      cleaned = cleaned.replace(cmd.raw, '');
    }

    // Clean up
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
  }

  buildActionsTimeline(text, parsed) {
    const actions = [];
    const lines = text.split('\n');

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Check if this line contains a command
      const cmdInLine = parsed.commands.find(cmd => line.includes(cmd.raw));
      if (cmdInLine) {
        actions.push({
          type: 'command',
          content: cmdInLine.command,
          line: i
        });
        continue;
      }

      // Check if this line contains explicit chat
      const chatMatch = line.match(this.chatPattern);
      if (chatMatch) {
        actions.push({
          type: 'chat',
          content: chatMatch[1].trim(),
          line: i
        });
        continue;
      }

      // Check if this line contains a thought
      const thoughtMatch = line.match(this.thoughtPattern);
      if (thoughtMatch) {
        actions.push({
          type: 'thought',
          content: thoughtMatch[1].trim(),
          line: i
        });
        continue;
      }
    }

    return actions;
  }

  // Format response for Minecraft
  formatForMinecraft(parsed, entityName) {
    const responses = [];

    // Add chat messages with entity tag
    for (const message of parsed.chat) {
      // No [AI] prefix to avoid duplication (chat monitor detects AI via other means)
      responses.push({
        type: 'chat',
        content: `tellraw @a {"text":"<${entityName}> ${this.escapeMinecraftText(message)}","color":"aqua"}`
      });
    }

    // Add commands
    for (const cmd of parsed.commands) {
      responses.push({
        type: 'command',
        content: cmd.command
      });
    }

    return responses;
  }

  escapeMinecraftText(text) {
    // Escape special characters for Minecraft JSON
    return text
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/\n/g, '\\n');
  }

  // Validate parsed response
  validate(parsed) {
    const issues = [];

    // Check if response has any actionable content
    if (parsed.chat.length === 0 && parsed.commands.length === 0) {
      issues.push({
        type: 'warning',
        message: 'No chat or commands found in response'
      });
    }

    // Validate command format
    for (const cmd of parsed.commands) {
      if (!cmd.command.startsWith('/')) {
        issues.push({
          type: 'warning',
          message: `Command should start with /: ${cmd.command}`
        });
      }
    }

    return {
      valid: issues.filter(i => i.type === 'error').length === 0,
      issues
    };
  }

  // Create example response format for LLM prompt
  getExampleFormat() {
    return `
RESPONSE FORMAT - You MUST use XML tags:

<thinking>I need to check the weather first</thinking>
<action>1</action>
<function>weather query</function>
<say>Let me check the weather for you!</say>

For multiple commands, use separate <function> tags:

<thinking>The player needs food and tools</thinking>
<action>1</action>
<function>give @p bread 5</function>
<function>give @p iron_pickaxe 1</function>
<say>Here's some food and a pickaxe!</say>

If you want to observe without speaking:
<thinking>They're just passing by, I'll stay quiet</thinking>
<action>0</action>

If no response is needed at all, use:
<silence/>

RULES:
- Output ONLY XML tags, no other text
- Commands should NOT include the leading /
- <thinking> is for internal reasoning (not shown to players)
- <action>0</action> = DON'T speak in chat (but still execute commands if any)
- <action>1</action> = DO speak in chat (default)
- <say> is for messages shown in chat (suppressed if action=0)
- <function> is for Minecraft commands (ALWAYS execute regardless of action)
- Use multiple <function> tags for multiple commands
`;
  }

  // Parse and validate in one step
  parseAndValidate(llmResponse, options = {}) {
    const parsed = this.parse(llmResponse, options);
    const validation = this.validate(parsed);

    return {
      ...parsed,
      validation
    };
  }
}

// Export singleton instance
export const llmParser = new LLMParser();
