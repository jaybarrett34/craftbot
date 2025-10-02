import { commandValidator } from './command-validator.js';

/**
 * Builds XML instruction templates for LLM prompts.
 * Separates character context from technical instructions.
 */
class XMLInstructionsBuilder {
  /**
   * Generate full XML instructions for an entity
   * @param {Object} entity - The entity configuration
   * @returns {string} - The XML instructions template
   */
  buildInstructions(entity) {
    const sections = [];

    // Response format section
    sections.push(this.getResponseFormatSection());

    // Critical rules section
    sections.push(this.getCriticalRulesSection());

    // Available commands section (dynamic based on entity permissions)
    sections.push(this.getAvailableCommandsSection(entity));

    // Command syntax examples section
    sections.push(this.getCommandSyntaxSection());

    return sections.join('\n\n');
  }

  /**
   * Get the response format section
   */
  getResponseFormatSection() {
    return `RESPONSE FORMAT - You MUST use XML tags:

<thinking>Your internal reasoning (not shown to players)</thinking>
<action>1</action>
<function>minecraft_command</function>
<say>Message to show in chat</say>

For multiple commands, use separate <function> tags:
<thinking>The player needs food and tools</thinking>
<action>1</action>
<function>give @p bread 5</function>
<function>give @p iron_pickaxe 1</function>
<say>Here's some food and a pickaxe!</say>

If you want to observe without speaking:
<thinking>They're just passing by, I'll stay quiet</thinking>
<action>0</action>

If no response is needed at all:
<silence/>`;
  }

  /**
   * Get the critical rules section
   */
  getCriticalRulesSection() {
    return `CRITICAL RULES:
- Output ONLY XML tags, absolutely no other text, markdown, or code blocks
- Commands should NOT include the leading slash (/)
- <thinking> is for internal reasoning (not shown to players)
- <action>0</action> = DON'T speak in chat (observe silently, but still execute commands if any)
- <action>1</action> = DO speak in chat (default if not specified)
- <say> is for messages shown in chat (DO NOT use /say command, use <say> tag instead)
- <say> will be suppressed if <action>0</action> is used, but <function> commands ALWAYS execute
- <function> is for Minecraft commands (NEVER put chat messages in <function>, use <say> for chat)
- Use multiple <function> tags for multiple commands, never combine them with newlines
- Use <action>0</action> when you want to listen/observe without drawing attention`;
  }

  /**
   * Get available commands section dynamically based on entity permissions
   * @param {Object} entity - The entity configuration
   */
  getAvailableCommandsSection(entity) {
    const permissionLevel = entity.permissions?.level || 'readonly';
    const allowedCommands = commandValidator.getAllowedCommandsForEntity(entity);

    if (!entity.permissions?.canExecuteCommands || allowedCommands.length === 0) {
      return `AVAILABLE MINECRAFT COMMANDS:
You have READ-ONLY access. You cannot execute any commands, only observe and chat.`;
    }

    // Group commands by category
    const commandsByCategory = {};
    for (const cmd of allowedCommands) {
      const category = cmd.category || 'Other';
      if (!commandsByCategory[category]) {
        commandsByCategory[category] = [];
      }
      commandsByCategory[category].push(cmd.command);
    }

    // Build the commands section
    let commandsText = `AVAILABLE MINECRAFT COMMANDS (${permissionLevel} level):\n`;

    for (const [category, commands] of Object.entries(commandsByCategory)) {
      commandsText += `${category}: ${commands.join(', ')}\n`;
    }

    // Add permission level description
    const levelDescriptions = {
      readonly: 'You can only observe and read information. Cannot execute any commands.',
      environment: 'You can execute non-destructive environment commands (time, weather, etc.).',
      mod: 'You can execute player management commands (kick, ban, teleport).',
      admin: 'You have full access to all commands and server operations.'
    };

    commandsText += `\nYour permission level: ${permissionLevel} - ${levelDescriptions[permissionLevel] || 'Custom permissions'}`;

    return commandsText.trim();
  }

  /**
   * Get command syntax examples section
   */
  getCommandSyntaxSection() {
    return `COMMAND SYNTAX EXAMPLES:
- give <player> <item> [count]: give @p diamond 5
- tp <target> <x> <y> <z>: tp Vecthan 100 64 200
- time set <value>: time set day (or time set 1000)
- weather <clear|rain|thunder>: weather clear
- gamemode <mode> [player]: gamemode creative @p
- effect give <target> <effect> [duration] [amplifier]: effect give @p speed 60 2
- summon <entity> [x] [y] [z]: summon minecraft:pig ~ ~ ~
- tellraw <target> <json>: tellraw @a {"text":"Hello!","color":"gold"}

USE @p for nearest player, @a for all players, @s for self`;
  }

  /**
   * Build a complete system prompt by combining character context with instructions
   * @param {Object} entity - The entity configuration
   * @returns {string} - The complete system prompt
   */
  buildFullSystemPrompt(entity, contextData = {}) {
    // Get character context (user-editable personality)
    let characterContext = '';

    // Support both old (systemPrompt) and new (characterContext) format
    if (entity.personality?.characterContext) {
      characterContext = entity.personality.characterContext;
    } else if (entity.personality?.systemPrompt) {
      // Backward compatibility: extract character context from old systemPrompt
      characterContext = this.extractCharacterContext(entity.personality.systemPrompt);
    } else {
      // Fallback: basic character description
      characterContext = `You are ${entity.name}, an AI entity in a Minecraft world.`;
    }

    // Add context about other entities and players
    let contextSection = '';
    if (contextData.players && contextData.players.length > 0) {
      contextSection += `\nCURRENT PLAYERS ONLINE: ${contextData.players.join(', ')}`;
    }
    if (contextData.aiEntities && contextData.aiEntities.length > 0) {
      const otherAIs = contextData.aiEntities.filter(name => name !== entity.name);
      if (otherAIs.length > 0) {
        contextSection += `\nOTHER AI ENTITIES: ${otherAIs.join(', ')} (you can talk to them if respondToAI is enabled)`;
      }
    }

    // Get XML instructions (auto-generated)
    const xmlInstructions = this.buildInstructions(entity);

    // Combine them
    return `${characterContext}${contextSection}\n\n${xmlInstructions}`;
  }

  /**
   * Extract character context from old systemPrompt format
   * This helps with backward compatibility
   */
  extractCharacterContext(systemPrompt) {
    // Find the first line before "RESPONSE FORMAT" or similar markers
    const markers = [
      'RESPONSE FORMAT',
      'CRITICAL RULES',
      'AVAILABLE MINECRAFT COMMANDS',
      'AVAILABLE COMMANDS'
    ];

    let text = systemPrompt;
    for (const marker of markers) {
      const index = text.indexOf(marker);
      if (index !== -1) {
        text = text.substring(0, index);
      }
    }

    return text.trim();
  }
}

// Export singleton instance
export const xmlInstructionsBuilder = new XMLInstructionsBuilder();
