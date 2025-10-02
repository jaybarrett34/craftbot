# XML Tag Reference for AI NPCs

Complete reference for XML tags used in LLM responses.

---

## Tag Overview

| Tag | Purpose | Visibility | Multiple Allowed | Required |
|-----|---------|-----------|------------------|----------|
| `<thinking>` | Internal reasoning | Hidden | ✅ Yes | ❌ No |
| `<say>` | Speech output | Visible | ✅ Yes | ❌ No |
| `<function>` | Execute commands | Varies | ✅ Yes | ❌ No |
| `<silence/>` | Choose not to speak | Hidden | ❌ No | ❌ No |

---

## `<thinking>` Tag

### Purpose
Internal reasoning and decision-making process. NOT shown to players.

### Usage
```xml
<thinking>
Your internal thoughts and reasoning here.
Can be multiple lines.
</thinking>
```

### When to Use
- Analyzing the situation
- Making decisions
- Considering options
- Planning responses

### Examples

**Simple reasoning:**
```xml
<thinking>Steve just greeted me. I should respond warmly.</thinking>
```

**Complex reasoning:**
```xml
<thinking>
The player is asking for help finding diamonds. Let me consider:
1. They're close by (5 blocks)
2. I have permission to give items
3. Diamonds are found below Y level 16
I should give them information and offer tools.
</thinking>
```

**Multiple thinking blocks:**
```xml
<thinking>Steve is asking about the village.</thinking>
<say>There's a village to the north.</say>
<thinking>I should offer to mark it on their map.</thinking>
<say>Would you like me to mark it for you?</say>
```

### Best Practices
- Use for ALL decision-making
- Be verbose - helps with debugging
- Think step-by-step
- Consider context and proximity

---

## `<say>` Tag

### Purpose
What the NPC says out loud. Displayed in Minecraft chat or chat bubble.

### Usage
```xml
<say>What you want to say</say>
```

### When to Use
- Responding to players
- Talking to other NPCs
- Making announcements
- Giving information

### Examples

**Simple greeting:**
```xml
<say>Hello Steve!</say>
```

**Multiple statements:**
```xml
<say>Hello there!</say>
<say>How can I help you today?</say>
```

**Long response:**
```xml
<say>There's a village about 500 blocks north of here. It's a long journey, so make sure you bring supplies!</say>
```

**Conversation:**
```xml
<thinking>Alex is asking about trading.</thinking>
<say>I have many items for trade!</say>
<say>What are you looking for?</say>
```

### Best Practices
- Keep messages under 256 characters (Minecraft limit)
- Use multiple `<say>` tags for long responses
- Be natural and in-character
- Match personality and tone

### Formatting Tips
- **Punctuation**: Use appropriate punctuation
- **Questions**: Ask follow-up questions
- **Emotion**: Show personality through word choice
- **Names**: Use player names when appropriate

---

## `<function>` Tag

### Purpose
Execute Minecraft commands. Must have proper permissions.

### Usage

**Plain command:**
```xml
<function>/give @p minecraft:diamond 1</function>
```

**JSON format (advanced):**
```xml
<function>
{
  "command": "/give",
  "params": {
    "target": "@p",
    "item": "minecraft:diamond_sword",
    "count": 1
  }
}
</function>
```

### Common Commands

**Give items:**
```xml
<function>/give @p minecraft:diamond_sword 1</function>
<function>/give @p minecraft:bread 16</function>
```

**Teleport:**
```xml
<function>/tp @p 100 64 200</function>
<function>/tp @p ~ ~10 ~</function>
```

**Effects:**
```xml
<function>/effect give @p minecraft:speed 30 1</function>
<function>/effect give @p minecraft:regeneration 10 2</function>
```

**Particles:**
```xml
<function>/particle minecraft:heart ~ ~2 ~ 0.5 0.5 0.5 0 10</function>
```

**Sounds:**
```xml
<function>/playsound minecraft:entity.villager.yes master @p</function>
```

**Messages:**
```xml
<function>/tell @p This is a private message</function>
```

### Multiple Commands

**Example: Give items and teleport**
```xml
<thinking>Player needs help. I'll give them gear and teleport them.</thinking>
<say>Let me help you out!</say>
<function>/give @p minecraft:diamond_sword 1</function>
<function>/give @p minecraft:diamond_pickaxe 1</function>
<function>/give @p minecraft:bread 32</function>
<say>I'm teleporting you to safety!</say>
<function>/tp @p 0 100 0</function>
<say>Stay safe out there!</say>
```

### Permission-Based Usage

**Trusted NPC (merchant):**
```javascript
allowedCommands: ['give', 'tp', 'tell', 'particle', 'playsound']
```
```xml
<function>/give @p minecraft:emerald 5</function>
```

**Guard NPC:**
```javascript
allowedCommands: ['tp', 'effect', 'particle', 'playsound']
```
```xml
<function>/effect give @p minecraft:resistance 60 2</function>
```

**Quest NPC:**
```javascript
allowedCommands: ['give', 'tell', 'particle']
```
```xml
<function>/give @p minecraft:map 1</function>
<function>/tell @p Check your map for quest details!</function>
```

### Best Practices
- Always check permissions before using
- Announce actions with `<say>` tags
- Use relative coordinates when possible (`~ ~ ~`)
- Test commands in creative mode first
- Avoid destructive commands unless necessary

### Security Notes
- **NEVER** allow `op`, `deop`, `stop`, `ban` unless absolutely necessary
- Use `deniedCommands` list for dangerous commands
- Validate commands before execution
- Log all command usage

---

## `<silence/>` Tag

### Purpose
Explicitly choose NOT to speak. Used when NPC decides interaction isn't appropriate.

### Usage
```xml
<silence/>
```

### When to Use
- Player is too far away
- Not relevant to the conversation
- NPC is busy or occupied
- Conversation doesn't require response

### Examples

**Player too far:**
```xml
<thinking>Player is 40 blocks away. Too far to interact meaningfully.</thinking>
<silence/>
```

**Not relevant:**
```xml
<thinking>Player is talking to someone else. This doesn't concern me.</thinking>
<silence/>
```

**Busy:**
```xml
<thinking>I'm currently helping another player. I shouldn't interrupt.</thinking>
<silence/>
```

**No response needed:**
```xml
<thinking>Player just said goodbye. No need to respond again.</thinking>
<silence/>
```

### Best Practices
- Always include `<thinking>` to explain WHY
- Use for proximity-based silence (>20 blocks)
- Use when NPC can't help
- Don't overuse - NPCs should be engaging

---

## Complete Examples

### Example 1: Helpful Merchant

**Scenario**: Player asks for help

```xml
<thinking>
Steve is asking for help and he's close by (3 blocks). He seems to need equipment. I'm a merchant with permission to give items. I should help him.
</thinking>
<say>Of course I can help you, Steve!</say>
<say>Let me give you some essential equipment.</say>
<function>/give @p minecraft:diamond_sword 1</function>
<function>/give @p minecraft:diamond_pickaxe 1</function>
<function>/give @p minecraft:bread 16</function>
<say>There you go! That should help you on your adventure.</say>
<say>Stay safe out there!</say>
```

### Example 2: Cautious Guard

**Scenario**: Warning about danger

```xml
<thinking>
I detect hostile mobs nearby. I should warn the player and offer protection. I can give them a resistance effect.
</thinking>
<say>Halt! There are hostile mobs in this area.</say>
<say>Let me grant you protection.</say>
<function>/effect give @p minecraft:resistance 120 2</function>
<function>/particle minecraft:barrier ~ ~2 ~ 1 1 1 0 20</function>
<say>Stay alert and keep your weapon ready!</say>
```

### Example 3: Quest Giver

**Scenario**: Starting a quest

```xml
<thinking>
Alex is interested in the quest. I should give them the quest item and explain what to do.
</thinking>
<say>Ah, a brave adventurer!</say>
<say>I have a quest for you, if you're interested.</say>
<function>/give @p minecraft:map 1</function>
<function>/give @p minecraft:compass 1</function>
<say>Take this map and compass.</say>
<say>Find the ancient temple marked on the map and return with the artifact.</say>
<say>Good luck, hero!</say>
<function>/playsound minecraft:entity.player.levelup master @p</function>
```

### Example 4: Distant Player

**Scenario**: Player too far away

```xml
<thinking>
I can barely see Steve in the distance. He's 35 blocks away. That's too far for meaningful conversation or interaction. I should stay silent.
</thinking>
<silence/>
```

### Example 5: NPC-to-NPC

**Scenario**: Responding to another NPC

```xml
<thinking>
The guard is asking if I've seen any suspicious activity. I haven't seen anything unusual, but I should respond to maintain good relations with the village guard.
</thinking>
<say>No, Sir Reginald, I haven't seen anything suspicious.</say>
<say>The village has been quiet today.</say>
<say>I'll let you know if I notice anything unusual.</say>
```

### Example 6: Trading Interaction

**Scenario**: Complex trading dialogue

```xml
<thinking>
Steve wants to trade. I'm a merchant, so this is my specialty. Let me offer him some options and see what he needs.
</thinking>
<say>Welcome to my shop, Steve!</say>
<say>I have many fine wares for trade.</say>
<say>What are you looking for today?</say>
<say>I have weapons, tools, food, and rare enchanted items!</say>
<function>/particle minecraft:happy_villager ~ ~2 ~ 0.5 0.5 0.5 0 10</function>
```

### Example 7: Emergency Response

**Scenario**: Player in danger

```xml
<thinking>
Alex is calling for help and sounds distressed! I see they're at low health. I need to act quickly - give them healing items and teleport them to safety.
</thinking>
<say>I'm coming to help, Alex!</say>
<function>/effect give @p minecraft:instant_health 1 2</function>
<function>/give @p minecraft:golden_apple 3</function>
<say>Eat those golden apples quickly!</say>
<function>/tp @p 0 100 0</function>
<say>You're safe now. What happened out there?</say>
```

---

## Advanced Patterns

### Pattern: Conditional Responses

```xml
<thinking>
Steve is asking for diamonds. I need to check:
- His proximity: 4 blocks (good)
- My permissions: Can give items (yes)
- His trust level: Known player (yes)
I'll give him a few diamonds but not too many.
</thinking>
<say>I can spare a few diamonds for you, Steve.</say>
<function>/give @p minecraft:diamond 5</function>
<say>Use them wisely!</say>
```

### Pattern: Emotional Responses

```xml
<thinking>
Alex just complimented my shop! I should express happiness and gratitude. I'll use particle effects and sound to show emotion.
</thinking>
<say>Oh, thank you so much, Alex!</say>
<say>That's very kind of you to say!</say>
<function>/particle minecraft:heart ~ ~2 ~ 0.5 0.5 0.5 0 20</function>
<function>/playsound minecraft:entity.villager.celebrate master @a</function>
<say>Come back anytime!</say>
```

### Pattern: Multi-Step Instructions

```xml
<thinking>
Steve is asking how to find diamonds. I should give him step-by-step instructions and some tools to help.
</thinking>
<say>Finding diamonds requires careful mining, Steve.</say>
<say>First, you need to dig down to Y level 11 or 12.</say>
<say>Then, use the branch mining technique.</say>
<say>Let me give you some tools to get started.</say>
<function>/give @p minecraft:iron_pickaxe 1</function>
<function>/give @p minecraft:torch 64</function>
<say>Good luck with your mining!</say>
<say>Remember to watch out for lava!</say>
```

### Pattern: Group Interaction

```xml
<thinking>
Multiple players are asking for help at once:
- Steve (3 blocks away)
- Alex (5 blocks away)
I should address both of them and help them together.
</thinking>
<say>Hello Steve and Alex!</say>
<say>I see you both need assistance.</say>
<say>Let me help you both out.</say>
<function>/give @a[distance=..10] minecraft:diamond_sword 1</function>
<function>/give @a[distance=..10] minecraft:bread 16</function>
<say>There you go, adventurers!</say>
<say>Work together and stay safe!</say>
```

---

## Common Mistakes

### ❌ Mistake: No thinking tag
```xml
<say>Hello!</say>
```

### ✅ Correct: Include reasoning
```xml
<thinking>Player greeted me. I should respond.</thinking>
<say>Hello!</say>
```

---

### ❌ Mistake: Function without say
```xml
<function>/give @p diamond 1</function>
```

### ✅ Correct: Announce actions
```xml
<say>Here's a diamond for you!</say>
<function>/give @p diamond 1</function>
```

---

### ❌ Mistake: Too far, still talking
```xml
<thinking>Player is 50 blocks away.</thinking>
<say>Hello distant player!</say>
```

### ✅ Correct: Use silence
```xml
<thinking>Player is 50 blocks away. Too far to interact.</thinking>
<silence/>
```

---

### ❌ Mistake: Dangerous command
```xml
<function>/stop</function>
```

### ✅ Correct: Use safe commands
```xml
<function>/give @p diamond 1</function>
```

---

## Tips for Better Responses

1. **Always think first**: Start with `<thinking>` to reason
2. **Be conversational**: Use natural language
3. **Show personality**: Match your character's traits
4. **Announce actions**: Tell players what you're doing
5. **Use proximity**: Consider distance in decisions
6. **Be helpful**: Offer assistance and information
7. **Stay in character**: Maintain consistent personality
8. **Use effects**: Particles and sounds enhance immersion

---

## Testing Your Responses

Use the test parser to validate your XML:

```javascript
import LLMParser from './src/services/llm-parser.js';

const response = `
  <thinking>Test thought</thinking>
  <say>Test speech</say>
`;

const parsed = LLMParser.parse(response);
console.log(parsed);
```

---

## XML Best Practices

1. **Proper nesting**: Close tags in correct order
2. **No nested tags**: Don't put `<say>` inside `<thinking>`
3. **Trim whitespace**: Parser handles whitespace, but be consistent
4. **Case insensitive**: `<SAY>` and `<say>` both work
5. **Self-closing**: Use `<silence/>` not `<silence></silence>`

---

## Reference Implementation

See `/examples/llm-usage-example.js` for complete working examples of all tag types.

---

Happy NPC building! 🎮
