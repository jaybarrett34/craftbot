import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

class CommandValidator {
  constructor() {
    this.commands = new Map();
    this.loadCommands();
  }

  loadCommands() {
    try {
      const csvPath = path.join(__dirname, '../data/minecraft-commands.csv');
      const csvContent = fs.readFileSync(csvPath, 'utf-8');
      const lines = csvContent.split('\n').filter(line => line.trim());

      // Skip header row
      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;

        const [command, category, permissionLevel, whitelist, description] = line.split(',');

        this.commands.set(command.trim(), {
          command: command.trim(),
          category: category.trim(),
          permissionLevel: permissionLevel.trim(),
          whitelisted: whitelist.trim() === 'true',
          description: description.trim()
        });
      }

      console.log(`[CommandValidator] Loaded ${this.commands.size} commands`);
    } catch (error) {
      console.error('[CommandValidator] Error loading commands:', error.message);
    }
  }

  parseCommand(input) {
    // Remove leading slash if present
    const cleanInput = input.trim().startsWith('/') ? input.trim().slice(1) : input.trim();

    // Extract command (first word)
    const parts = cleanInput.split(/\s+/);
    const command = parts[0];
    const args = parts.slice(1);

    return { command, args, fullCommand: cleanInput };
  }

  validateCommand(input, entity) {
    const { command, args, fullCommand } = this.parseCommand(input);

    // Check if entity is provided
    if (!entity) {
      return {
        valid: false,
        error: 'No entity provided for validation',
        command
      };
    }

    // Check if entity has permission to execute commands at all
    if (!entity.permissions?.canExecuteCommands) {
      return {
        valid: false,
        error: 'Entity does not have permission to execute commands',
        command
      };
    }

    // Get command info from CSV
    const commandInfo = this.commands.get(command);

    if (!commandInfo) {
      return {
        valid: false,
        error: `Unknown command: ${command}`,
        command,
        suggestion: 'Command not found in whitelist. Ensure the command exists in minecraft-commands.csv'
      };
    }

    // Check if command is globally whitelisted
    if (!commandInfo.whitelisted) {
      // Check if entity explicitly allows this command
      if (!this.isCommandAllowedForEntity(command, entity)) {
        return {
          valid: false,
          error: `Command "${command}" is not whitelisted for general use`,
          command,
          commandInfo
        };
      }
    }

    // Check entity's blacklist
    if (entity.permissions?.blacklistedCommands?.includes(command) ||
        entity.permissions?.blacklistedCommands?.includes('*')) {
      return {
        valid: false,
        error: `Command "${command}" is blacklisted for this entity`,
        command
      };
    }

    // Check entity's whitelist (if not using wildcard)
    if (!entity.permissions?.whitelistedCommands?.includes('*')) {
      if (!entity.permissions?.whitelistedCommands?.includes(command)) {
        return {
          valid: false,
          error: `Command "${command}" is not in entity's whitelist`,
          command
        };
      }
    }

    // Check permission level
    const hasPermission = this.checkPermissionLevel(
      entity.permissions.level,
      commandInfo.permissionLevel
    );

    if (!hasPermission) {
      return {
        valid: false,
        error: `Insufficient permission level. Command requires "${commandInfo.permissionLevel}", entity has "${entity.permissions.level}"`,
        command,
        commandInfo,
        requiredLevel: commandInfo.permissionLevel,
        entityLevel: entity.permissions.level
      };
    }

    // All checks passed
    return {
      valid: true,
      command,
      args,
      fullCommand,
      commandInfo,
      entity: {
        id: entity.id,
        name: entity.name,
        level: entity.permissions.level
      }
    };
  }

  isCommandAllowedForEntity(command, entity) {
    // Check whitelist
    if (entity.permissions?.whitelistedCommands?.includes('*') ||
        entity.permissions?.whitelistedCommands?.includes(command)) {
      // Check it's not in blacklist
      if (!entity.permissions?.blacklistedCommands?.includes(command)) {
        return true;
      }
    }
    return false;
  }

  checkPermissionLevel(entityLevel, requiredLevel) {
    const levels = ['readonly', 'environment', 'user', 'mod', 'admin'];
    const entityLevelIndex = levels.indexOf(entityLevel);
    const requiredLevelIndex = levels.indexOf(requiredLevel);

    if (entityLevelIndex === -1 || requiredLevelIndex === -1) {
      return false;
    }

    return entityLevelIndex >= requiredLevelIndex;
  }

  getCommandInfo(command) {
    const { command: cmdName } = this.parseCommand(command);
    return this.commands.get(cmdName);
  }

  getCommandsByCategory(category) {
    const result = [];
    for (const [, cmdInfo] of this.commands) {
      if (cmdInfo.category === category) {
        result.push(cmdInfo);
      }
    }
    return result;
  }

  getCommandsByPermissionLevel(level) {
    const result = [];
    for (const [, cmdInfo] of this.commands) {
      if (cmdInfo.permissionLevel === level) {
        result.push(cmdInfo);
      }
    }
    return result;
  }

  getAllowedCommandsForEntity(entity) {
    if (!entity?.permissions) {
      return [];
    }

    const allowed = [];

    for (const [, cmdInfo] of this.commands) {
      // Check if whitelisted globally or in entity's whitelist
      const isWhitelisted = cmdInfo.whitelisted ||
        entity.permissions.whitelistedCommands?.includes('*') ||
        entity.permissions.whitelistedCommands?.includes(cmdInfo.command);

      // Check not blacklisted
      const isBlacklisted = entity.permissions.blacklistedCommands?.includes(cmdInfo.command);

      // Check permission level
      const hasPermission = this.checkPermissionLevel(
        entity.permissions.level,
        cmdInfo.permissionLevel
      );

      if (isWhitelisted && !isBlacklisted && hasPermission) {
        allowed.push(cmdInfo);
      }
    }

    return allowed;
  }

  getStats() {
    const stats = {
      total: this.commands.size,
      byCategory: {},
      byPermissionLevel: {},
      whitelisted: 0
    };

    for (const [, cmdInfo] of this.commands) {
      // By category
      stats.byCategory[cmdInfo.category] = (stats.byCategory[cmdInfo.category] || 0) + 1;

      // By permission level
      stats.byPermissionLevel[cmdInfo.permissionLevel] =
        (stats.byPermissionLevel[cmdInfo.permissionLevel] || 0) + 1;

      // Whitelisted
      if (cmdInfo.whitelisted) {
        stats.whitelisted++;
      }
    }

    return stats;
  }
}

// Export singleton instance
export const commandValidator = new CommandValidator();
