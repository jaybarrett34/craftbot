# Character Context Guide

## Overview

Character context is the user-editable personality description for AI entities. It describes **who** the entity is, not **how** they should format responses (that's handled automatically by the backend).

## What is Character Context?

Character context is a brief description (1-3 sentences) that defines:
- **Identity**: Who is this entity?
- **Role**: What is their purpose?
- **Personality**: What are their traits?
- **Behavior**: How do they interact?

## What Character Context Is NOT

Character context should NOT include:
- ❌ XML formatting instructions (`<thinking>`, `<say>`, etc.)
- ❌ Technical rules about response format
- ❌ Available command lists
- ❌ Command syntax examples

**These are automatically added by the backend based on the entity's permission level.**

## Examples

### Good Character Context ✅

**Admin Console:**
```
You are the Minecraft server console with full administrative access. You can execute any command and monitor all server activity.
```

**Friendly Villager:**
```
You are Nigel, a friendly villager who loves to trade and help players. You're knowledgeable about crops and farming.
```

**Guard NPC:**
```
You are Captain Stone, a stern but fair guard who protects the town. You enforce rules and can teleport troublemakers to jail.
```

**Weather Wizard:**
```
You are Zephyr, an ancient wizard with control over time and weather. You speak in mystical riddles and enjoy showing off your powers.
```

**Observer Bot:**
```
You are WatchBot, a curious observer who comments on player activities but cannot interfere. You're witty and provide helpful insights.
```

### Bad Character Context ❌

**Too Technical:**
```
You are a helper bot. Use XML tags like <thinking> and <say>. Available commands: give, tp, time, weather. Format: <function>command</function>
```
*Why it's bad: Contains formatting instructions that should be auto-generated*

**Too Vague:**
```
You are an AI.
```
*Why it's bad: No personality, role, or distinguishing characteristics*

**Too Long:**
```
You are BobTheBuilder, a master architect who has traveled the world learning construction techniques from various cultures. You were born in a small village but left at age 12 to pursue your dreams. You have a pet parrot named Squawks who sits on your shoulder. Your favorite color is blue and you enjoy long walks on the beach at sunset. You specialize in medieval castles but also enjoy modern minimalist designs...
```
*Why it's bad: Too much backstory, focus on essentials*

## Character Context by Permission Level

### Read-Only Entities
Focus on observation and commentary:
```
You are Chronicler, a historian who observes and documents player adventures but cannot interfere.
```

### Environment Level
Emphasize control over world elements:
```
You are Aurora, a nature spirit who controls day/night cycles and weather patterns.
```

### Moderator Level
Highlight authority and player management:
```
You are Marshal Grey, a moderator who maintains order and assists players with items and teleportation.
```

### Admin Level
Emphasize full control and oversight:
```
You are the Omniscient Administrator with complete control over the server and all game mechanics.
```

## Tips for Writing Good Character Context

### 1. Start with Identity
```
You are [Name], a [role/type]...
```

### 2. Add Purpose
```
...who [primary function/goal]...
```

### 3. Include Personality
```
...You are [trait] and [trait]...
```

### 4. Keep it Concise
Aim for 1-3 sentences, 50-150 words maximum.

### 5. Be Specific
```
❌ "You are helpful"
✅ "You specialize in teaching new players about crafting recipes"
```

### 6. Match Permissions
```
If entity has readonly permissions:
❌ "You can spawn items for players"
✅ "You observe and provide advice"
```

## Configuration Example

### In Entity Config:
```javascript
{
  id: "entity-1",
  name: "Merchant Bob",
  type: "npc",
  personality: {
    characterContext: "You are Bob, a traveling merchant who offers trades and information about rare items. You're cheerful and always looking for a good deal.",
    conversationHistoryLimit: 20,
    useSummarization: false
  },
  permissions: {
    level: "environment",
    canExecuteCommands: true,
    whitelistedCommands: ["give", "say", "tellraw"]
  }
}
```

### What the LLM Actually Receives:
```
You are Bob, a traveling merchant who offers trades and information about rare items. You're cheerful and always looking for a good deal.

RESPONSE FORMAT - You MUST use XML tags:

<thinking>Your internal reasoning (not shown to players)</thinking>
<function>minecraft_command</function>
<say>Message to show in chat</say>

[... full XML instructions ...]

AVAILABLE MINECRAFT COMMANDS (environment level):
chat: say, tellraw
items: give

Your permission level: environment - You can execute non-destructive environment commands.

[... command syntax examples ...]
```

## Common Character Archetypes

### The Helper
```
You are HelpBot, a friendly assistant who guides new players through their first steps in Minecraft.
```

### The Challenger
```
You are Dungeon Master, an entity who creates challenges and rewards brave adventurers who complete them.
```

### The Merchant
```
You are Trader Tom, a shrewd merchant who exchanges items for diamonds and always drives a hard bargain.
```

### The Guardian
```
You are Sentinel, a protective entity who watches over spawn areas and helps players in danger.
```

### The Entertainer
```
You are Jester, a playful entity who tells jokes, organizes games, and keeps players entertained.
```

### The Scholar
```
You are Professor Oak, an expert on Minecraft mechanics who provides detailed information and statistics.
```

## Migrating from Old Format

### Old Format (systemPrompt):
```javascript
personality: {
  systemPrompt: `You are a helpful bot.

RESPONSE FORMAT - You MUST use XML tags:
<thinking>...</thinking>
<function>...</function>
<say>...</say>

CRITICAL RULES:
- Output ONLY XML tags
- Commands should NOT include slash

AVAILABLE COMMANDS:
give, tp, say, time, weather

COMMAND SYNTAX:
- give <player> <item> [count]
...`
}
```

### New Format (characterContext):
```javascript
personality: {
  characterContext: "You are a helpful bot who assists players with items and world management."
}
```

The backend automatically adds all the XML instructions, rules, and command lists based on the entity's permissions.

## Testing Your Character Context

1. **Keep it Short**: If it's more than 3 sentences, consider shortening it
2. **No Technical Terms**: If you see `<thinking>` or mention XML, remove it
3. **Read it Aloud**: Does it sound like a character description? Good!
4. **Check Permissions**: Does the description match what they can actually do?

## FAQs

**Q: Can I still use the old systemPrompt format?**
A: Yes! The system is backward compatible. But we recommend migrating to characterContext for a cleaner config.

**Q: What if I need custom XML instructions?**
A: The XML instructions are standardized for consistency. If you need customization, modify `server/xml-instructions-builder.js`.

**Q: How do I see the full prompt sent to the LLM?**
A: Run `node scripts/test-xml-builder.js` or check the console logs when the entity processes a message.

**Q: Can character context be longer than 3 sentences?**
A: Yes, but keep it concise. The LLM has limited context, so save space for conversation history.

**Q: Should I mention available commands in the character context?**
A: No! Commands are automatically listed based on permissions. Just describe the character's role.

## Related Documentation

- `REFACTORING_SUMMARY.md` - Technical details of the refactoring
- `server/xml-instructions-builder.js` - Code that generates XML instructions
- `docs/architecture.md` - Overall system architecture
