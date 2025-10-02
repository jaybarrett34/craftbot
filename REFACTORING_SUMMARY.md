# System Prompt Architecture Refactoring Summary

## Overview
Successfully separated character context (user-editable personality) from XML formatting instructions (auto-injected by backend). This makes the frontend cleaner and ensures consistent XML instructions across all entities.

## Changes Made

### 1. New Module: `server/xml-instructions-builder.js`

Created a new helper module that dynamically generates XML instructions based on entity permissions.

**Key Functions:**
- `buildFullSystemPrompt(entity)` - Combines character context with XML instructions
- `buildInstructions(entity)` - Generates dynamic XML instructions
- `getAvailableCommandsSection(entity)` - Lists commands based on entity's permission level
- `extractCharacterContext(systemPrompt)` - Backward compatibility helper

**Features:**
- Dynamically includes entity's available commands based on permission level
- Supports both new `characterContext` and old `systemPrompt` formats
- Consistent XML format across all entities
- Auto-generates permission level descriptions

### 2. Updated: `src/config/defaultConfig.js`

**Before:**
```javascript
personality: {
  systemPrompt: `You are the Minecraft server console...

RESPONSE FORMAT - You MUST use XML tags:
<thinking>...</thinking>
...
[50+ lines of technical instructions]`,
  conversationHistoryLimit: 50,
  useSummarization: true
}
```

**After:**
```javascript
personality: {
  characterContext: `You are the Minecraft server console with full administrative access. You can execute any command and monitor all server activity.`,
  conversationHistoryLimit: 50,
  useSummarization: true
}
```

**Impact:** Cleaner, more user-friendly configuration. Character personality is now just 1-2 sentences.

### 3. Updated: `server/conversation-queue.js`

**Before:**
```javascript
buildFullContext(entity, recentMessages = 10) {
  const context = [];

  // Add system prompt directly
  if (entity.personality?.systemPrompt) {
    context.push({
      role: 'system',
      content: entity.personality.systemPrompt
    });
  }

  // Add conversation history
  const history = this.getConversationContext(entity.id, recentMessages);
  context.push(...history);

  return context;
}
```

**After:**
```javascript
buildFullContext(entity, recentMessages = 10) {
  const context = [];

  // Build full system prompt: character context + XML instructions
  // This supports both new (characterContext) and old (systemPrompt) formats
  const fullSystemPrompt = xmlInstructionsBuilder.buildFullSystemPrompt(entity);

  context.push({
    role: 'system',
    content: fullSystemPrompt
  });

  // Add conversation history
  const history = this.getConversationContext(entity.id, recentMessages);
  context.push(...history);

  return context;
}
```

**Impact:** XML instructions are now auto-injected at runtime, keeping them consistent and up-to-date.

### 4. Updated: `src/components/EntityConfigSidebar.jsx`

**Before:**
```javascript
<label>System Prompt</label>
<textarea
  value={selectedEntity.personality.systemPrompt}
  onChange={(e) => handleNestedFieldChange('personality.systemPrompt', e.target.value)}
  rows={4}
  placeholder="Define the entity's personality, behavior, and role..."
/>
```

**After:**
```javascript
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
```

**Impact:**
- Cleaner UI with better labeling
- Help text explains the separation of concerns
- Backward compatible (reads old `systemPrompt` field if new one doesn't exist)

### 5. Updated: `server/mcp-server.js` (handleAIEntitySpawn)

**Before:**
```javascript
personality: {
  systemPrompt: `You are ${entityName}, an AI entity...

RESPONSE FORMAT - You MUST use XML tags:
...
[40+ lines of technical instructions]`,
  conversationHistoryLimit: 20,
  useSummarization: false
}
```

**After:**
```javascript
personality: {
  characterContext: `You are ${entityName}, an AI entity in a Minecraft world. You can chat with players and perform basic commands. Be helpful and friendly!`,
  conversationHistoryLimit: 20,
  useSummarization: false
}
```

**Impact:** Auto-spawned entities now have clean, concise character descriptions.

### 6. Updated: `src/components/MobSpawner.jsx`

**Before:**
```javascript
personality: {
  systemPrompt: `You are ${mobName}, a ${mobType.replace('minecraft:', '')} in Minecraft.`,
  conversationHistoryLimit: 20,
  useSummarization: false
}
```

**After:**
```javascript
personality: {
  characterContext: `You are ${mobName}, a ${mobType.replace('minecraft:', '')} in Minecraft. You are friendly and enjoy interacting with players.`,
  conversationHistoryLimit: 20,
  useSummarization: false
}
```

**Impact:** Spawned mobs have cleaner personality definitions.

## Dynamic Features

### Permission-Based Command Lists

The XML instructions now dynamically show available commands based on the entity's permission level:

**Admin Level:**
```
AVAILABLE MINECRAFT COMMANDS (admin level):
chat: say, tell, msg, whisper, tellraw
items: give, clear, item, enchant
movement: teleport, tp, spreadplayers
entities: summon, kill, tag
effects: effect
player: xp, spawnpoint, team, advancement, recipe
admin: gamemode, gm, op, deop, ban, ban-ip, pardon, pardon-ip, kick, stop, whitelist, save-all, save-on, save-off, reload, debug, gamerule
world: time, weather, difficulty, setworldspawn, forceload, worldborder
building: setblock, fill, clone
scripting: execute, function, scoreboard
advanced: data
info: list, seed, locate, locatebiome
visual: particle, title
audio: playsound, stopsound

Your permission level: admin - You have full access to all commands and server operations.
```

**Read-Only Level:**
```
AVAILABLE MINECRAFT COMMANDS:
You have READ-ONLY access. You cannot execute any commands, only observe and chat.
```

## Backward Compatibility

The system fully supports both formats:

1. **New Format (Preferred):**
   ```javascript
   personality: {
     characterContext: "You are a helpful assistant..."
   }
   ```

2. **Old Format (Supported):**
   ```javascript
   personality: {
     systemPrompt: "You are a helpful assistant...\n\nRESPONSE FORMAT..."
   }
   ```

The `extractCharacterContext()` function automatically strips XML instructions from old-style prompts.

## Benefits

### For Users:
- **Cleaner UI**: No more scrolling through technical XML instructions
- **Easier Configuration**: Just describe the character's personality
- **Better Guidance**: Help text explains what to enter
- **Consistent Format**: All entities use the same XML format automatically

### For Developers:
- **Single Source of Truth**: XML instructions defined in one place
- **Easier Updates**: Change XML format once, applies to all entities
- **Dynamic Commands**: Instructions adapt based on permissions
- **Maintainable**: Character personality separate from technical details

### For LLMs:
- **Consistent Instructions**: Same XML format across all entities
- **Permission-Aware**: Only shown commands they can actually use
- **Clear Constraints**: Permission level explicitly stated
- **Better Responses**: Less confusion about available commands

## Example Output

### Admin Entity Full Prompt:
```
You are the Minecraft server console with full administrative access. You can execute any command and monitor all server activity.

RESPONSE FORMAT - You MUST use XML tags:

<thinking>Your internal reasoning (not shown to players)</thinking>
<function>minecraft_command</function>
<say>Message to show in chat</say>

...

AVAILABLE MINECRAFT COMMANDS (admin level):
chat: say, tell, msg, whisper, tellraw
items: give, clear, item, enchant
...
```

**Character Context:** 112 characters
**Full Prompt:** ~2,100 characters
**Instructions Added:** ~2,000 characters (automatic)

## Testing

Created test script: `scripts/test-xml-builder.js`

**Run with:**
```bash
node scripts/test-xml-builder.js
```

**Tests:**
- Admin level entity (all commands)
- Read-only entity (no commands)
- Environment level entity (limited commands)
- Legacy entity (backward compatibility)

All tests passed successfully.

## Migration Notes

### Existing Entities:
- No migration needed - backward compatible
- Old `systemPrompt` fields will continue to work
- Character context automatically extracted from old format
- Gradually update to new format when editing entities

### New Entities:
- Use `characterContext` field instead of `systemPrompt`
- Keep it brief (1-3 sentences)
- Focus on personality, not technical instructions
- XML instructions added automatically

## Files Modified

1. ✅ `server/xml-instructions-builder.js` (NEW)
2. ✅ `src/config/defaultConfig.js`
3. ✅ `server/conversation-queue.js`
4. ✅ `src/components/EntityConfigSidebar.jsx`
5. ✅ `server/mcp-server.js`
6. ✅ `src/components/MobSpawner.jsx`
7. ✅ `scripts/test-xml-builder.js` (NEW - for testing)

## Next Steps (Optional Enhancements)

1. **Add UI Preview**: Show full generated prompt in a collapsible section
2. **Command Browser**: Visual list of available commands per permission level
3. **Template Library**: Pre-made character personalities users can choose from
4. **Validation**: Warn if characterContext is too long or contains XML tags
5. **Documentation**: Update user guide with new character description format

## Conclusion

The refactoring successfully separates concerns between user-editable character personality and technical XML formatting instructions. The system is backward compatible, more maintainable, and provides a better user experience while ensuring consistent LLM instructions across all entities.
