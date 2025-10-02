# Minecraft Java Edition 1.20+ Research for AI NPC System

## Table of Contents
1. [Command Overview](#command-overview)
2. [Permission Levels](#permission-levels)
3. [Execute Command Context](#execute-command-context)
4. [Querying Nearby Entities](#querying-nearby-entities)
5. [NPC Detection with Name Tags](#npc-detection-with-name-tags)
6. [Getting Player Data](#getting-player-data)
7. [Private vs Public Messages](#private-vs-public-messages)
8. [Proximity Detection](#proximity-detection)
9. [Chat Bubbles and Floating Text](#chat-bubbles-and-floating-text)
10. [Commands for NPC Interactions](#commands-for-npc-interactions)

---

## Command Overview

Minecraft Java Edition commands are entered via the chat window and always begin with a forward slash (`/`). For single-player, cheats must be enabled when creating the world. For multiplayer servers, players need appropriate permission levels to execute commands.

All commands in version 1.13+ use a consistent syntax with improved tab completion and error messages. Commands can be executed from:
- Player chat
- Command blocks (permission level 2)
- Functions (permission level 2, max)
- Server console (permission level 4)

---

## Permission Levels

Minecraft Java Edition uses a hierarchical permission system with 5 levels (0-4):

| Level | Name | Description | Typical Use |
|-------|------|-------------|-------------|
| 0 | All | No special permissions | Default players, read-only operations |
| 1 | Moderator | Basic moderation | Player can use command blocks |
| 2 | Gamemaster | Multiplayer management | Command blocks, functions, most gameplay commands |
| 3 | Admin | Advanced administration | Server configuration commands |
| 4 | Owner | Full control | All commands including server management |

**Key Points:**
- Levels are cumulative: Level 2 can do everything Level 0 and 1 can do
- Command blocks have permission level 2
- Functions executed with level 2+ are capped at level 2
- The `/execute` command CANNOT change permission levels
- Most gameplay commands (give, summon, teleport, etc.) require level 2

**Recommended Permission Mapping for AI NPC:**
- **readonly**: Level 0 - For querying state, sending messages
- **mob**: Level 2 - For NPC actions like spawning items, effects, sounds
- **environment**: Level 2 - For world modifications
- **admin**: Level 3-4 - For privileged operations

---

## Execute Command Context

The `/execute` command is the most powerful command for AI NPCs as it allows context switching and conditional execution.

### Basic Structure
```
/execute <subcommands...> run <command>
```

### Key Subcommands

#### Context Modifiers
- **as <selector>**: Changes who executes the command (changes @s)
- **at <selector>**: Changes execution position (but not rotation/dimension)
- **positioned <x> <y> <z>**: Sets execution position
- **positioned as <selector>**: Sets position to match entity
- **rotated <yaw> <pitch>**: Sets execution rotation
- **rotated as <selector>**: Sets rotation to match entity
- **facing <x> <y> <z>**: Rotates to face coordinates
- **facing entity <selector>**: Rotates to face entity
- **in <dimension>**: Changes execution dimension
- **anchored <eyes|feet>**: Changes anchor point for position

#### Conditional Execution
- **if entity <selector>**: Runs if entities match
- **unless entity <selector>**: Runs if no entities match
- **if block <pos> <block>**: Checks block at position
- **if score**: Compares scoreboard values
- **if data**: Checks NBT data existence
- **if predicate**: Checks custom predicate

#### Storing Results
- **store result**: Stores command result value
- **store success**: Stores command success (0 or 1)

### Examples for NPCs

**Detect and respond to nearby player:**
```
/execute as @e[type=armor_stand,tag=AI] at @s if entity @a[distance=..5] run tellraw @a[distance=..5] {"text":"Hello, traveler!","color":"green"}
```

**Give item as NPC to nearest player:**
```
/execute as @e[type=armor_stand,tag=NPC] at @s run give @p[distance=..3] minecraft:diamond 1
```

**Check if player is looking at NPC:**
```
/execute as @a at @s anchored eyes facing entity @e[type=armor_stand,tag=NPC,limit=1] eyes anchored feet positioned ^ ^ ^1 rotated as @s positioned ^ ^ ^-1 if entity @s[distance=..0.3] run say I see you!
```

**Store player health in scoreboard:**
```
/execute store result score @p health run data get entity @p Health
```

---

## Querying Nearby Entities

Entity selectors allow filtering entities by various criteria. The most relevant for AI NPCs:

### Entity Selector Variables
- `@a`: All players
- `@p`: Nearest player
- `@e`: All entities
- `@s`: Self (executing entity)
- `@r`: Random player

### Key Selector Arguments

#### Distance
```
@a[distance=..5]        # Within 5 blocks
@a[distance=5..]        # 5 blocks or more away
@a[distance=3..7]       # Between 3 and 7 blocks
```

Distance is measured as Euclidean (straight-line) distance from the entity's feet.

#### Type
```
@e[type=zombie]         # All zombies
@e[type=!zombie]        # Everything except zombies
@e[type=#minecraft:raiders]  # All raider mobs (tag)
```

#### Tags
```
@e[tag=quest_giver]     # Entities with "quest_giver" tag
@e[tag=!processed]      # Entities without "processed" tag
```

#### Name
```
@e[name="[AI] Steve"]   # Entity with exact custom name
@e[name="Steve"]        # Matches display name
```

**Important**: Name selector checks display name, not CustomName NBT tag directly. Multi-word names work in selectors.

#### Position
```
@a[x=100,y=64,z=200,distance=..10]  # Near specific coordinates
@a[dx=5,dy=5,dz=5]                  # Within rectangular volume
```

#### Limit and Sort
```
@a[limit=1]             # Only 1 player
@a[sort=nearest]        # Sorted by distance (nearest first)
@a[sort=furthest]       # Furthest first
@a[sort=random]         # Random order
@a[sort=arbitrary]      # Arbitrary (fastest)
```

#### NBT Data
```
@e[nbt={NoGravity:1b}]  # Entities with NoGravity=true
@e[nbt={Item:{id:"minecraft:diamond"}}]  # Items of specific type
```

### Practical Examples for AI NPCs

**Find all players within 10 blocks:**
```
/execute as @e[type=armor_stand,tag=AI] at @s run say Found @a[distance=..10]
```

**Find nearest player not in creative mode:**
```
/execute as @e[type=armor_stand,tag=NPC] at @s run tellraw @p[distance=..5,gamemode=!creative] {"text":"Need help?"}
```

**Find all entities with [AI] tag within 20 blocks:**
```
/execute at @s run tag @e[distance=..20,name="[AI]"] add ai_entity
```

**Count nearby hostile mobs:**
```
/execute store result score @s mob_count run execute if entity @e[type=#minecraft:hostile,distance=..15]
```

---

## NPC Detection with Name Tags

For an AI NPC system, you'll want to detect entities with specific naming patterns (e.g., names starting with `[AI]`).

### Method 1: Using the `name` Selector (Exact Match)
```
@e[type=armor_stand,name="[AI] Shopkeeper"]
@e[type=villager,name="[AI] Quest Giver"]
```

This matches entities with that exact display name. It works with multi-word names and special characters.

### Method 2: Using NBT Data (CustomName)
```
@e[nbt={CustomName:'{"text":"[AI] Merchant"}'}]
```

This checks the CustomName NBT tag directly, which stores the entity's custom name as JSON text.

### Method 3: Using Scoreboard Tags (Recommended for AI System)
The most flexible and performant approach is to tag AI entities:

```
# Tag all entities with [AI] in their name on spawn
/tag @e[type=armor_stand] add AI_NPC

# Then filter by tag
/execute as @e[tag=AI_NPC] at @s run <command>
```

**Advantages:**
- Fast performance (no string matching)
- Can combine multiple tags (e.g., `AI_NPC`, `quest_giver`, `merchant`)
- Easy to add/remove dynamically
- Works with any entity type

### Method 4: Detecting Name Prefix (Workaround)

Since there's no built-in "starts with" operator, you need to either:
1. Use exact name matching for each NPC
2. Tag entities on creation
3. Use a function to check and tag entities periodically

**Example function to tag AI entities:**
```mcfunction
# In function mypack:tag_ai_npcs.mcfunction
tag @e[type=armor_stand,name="[AI] Shopkeeper"] add AI_NPC
tag @e[type=armor_stand,name="[AI] Guard"] add AI_NPC
tag @e[type=villager,name="[AI] Quest Giver"] add AI_NPC
# etc...
```

### Practical Implementation for AI NPCs

**1. Create NPC with custom name:**
```
/summon armor_stand ~ ~ ~ {CustomName:'{"text":"[AI] Helper","color":"aqua"}',NoGravity:1b,Tags:["AI_NPC","helper"]}
```

**2. Add tag automatically using function (runs every tick or on events):**
```
/tag @e[type=armor_stand,name="[AI] Helper"] add AI_NPC
/tag @e[type=armor_stand,name="[AI] Helper"] add helper_type
```

**3. Detect nearby NPCs:**
```
/execute as @a at @s if entity @e[tag=AI_NPC,distance=..3] run function mypack:npc_nearby
```

---

## Getting Player Data

The `/data get` command (Java Edition only) allows querying player NBT data including inventory, health, position, and more.

### Basic Syntax
```
/data get entity <selector> [path] [scale]
```

### Important Player Data Paths

#### Position
```
/data get entity @p Pos
# Returns: [x, y, z] coordinates as doubles
```

#### Health
```
/data get entity @p Health
# Returns: Current health (20.0 = full health)
```

#### Inventory
```
/data get entity @p Inventory
# Returns: List of all items in inventory with NBT data

/data get entity @p Inventory[0]
# Returns: First inventory slot item

/data get entity @p Inventory[{Slot:100b}]
# Returns: Item in specific slot (100b = feet armor)
```

#### Selected Hotbar Slot
```
/data get entity @p SelectedItemSlot
# Returns: 0-8, which hotbar slot is selected
```

#### Experience
```
/data get entity @p XpLevel    # Current level
/data get entity @p XpP        # Progress to next level (0.0-1.0)
/data get entity @p XpTotal    # Total XP points
```

#### Game Mode
```
/data get entity @p playerGameType
# Returns: 0=survival, 1=creative, 2=adventure, 3=spectator
```

#### Dimension
```
/data get entity @p Dimension
# Returns: "minecraft:overworld", "minecraft:the_nether", "minecraft:the_end"
```

#### Rotation (Looking Direction)
```
/data get entity @p Rotation
# Returns: [yaw, pitch] in degrees
```

#### Food Level
```
/data get entity @p foodLevel        # 0-20 (20 = full)
/data get entity @p foodSaturationLevel  # Saturation value
```

### Storing Results in Scoreboards

To use player data in commands, store it in scoreboard objectives:

```
# Create objective
/scoreboard objectives add health dummy

# Store player health
/execute store result score @p health run data get entity @p Health

# Use in conditions
/execute as @a if score @s health matches ..10 run effect give @s minecraft:regeneration 10 1
```

### Examples for AI NPCs

**Check if player has specific item:**
```
/execute as @p if data entity @s Inventory[{id:"minecraft:diamond"}] run say You have a diamond!
```

**Get player's current position for pathfinding:**
```
/execute store result score @p pos_x run data get entity @p Pos[0]
/execute store result score @p pos_y run data get entity @p Pos[1]
/execute store result score @p pos_z run data get entity @p Pos[2]
```

**Check if player is at low health:**
```
/execute as @a store result score @s health run data get entity @s Health
/execute as @e[tag=AI_NPC] at @s as @a[distance=..5] if score @s health matches ..10 run tellraw @s {"text":"You look hurt! Need healing?","color":"yellow"}
```

**Check player's inventory for quest items:**
```
/execute as @p if data entity @s Inventory[{id:"minecraft:emerald",Count:10b}] run tellraw @s {"text":"Quest complete! You have 10 emeralds."}
```

### Important Limitations

- Cannot remove player NBT data (only query/modify)
- Some paths are read-only
- Must specify exact NBT structure for complex data
- Selector must resolve to single entity type

---

## Private vs Public Messages

Minecraft offers several ways to communicate with players, each with different visibility.

### Public Messages (Visible to All)

#### `/say` Command
- **Syntax**: `/say <message>`
- **Permission**: Level 2 (mob)
- **Visibility**: All players on server
- **Format**: Displays as `[Server] message` or `[Username] message`
- **Use Case**: Server-wide announcements

```
/say The dragon has been awakened!
```

#### `/me` Command
- **Syntax**: `/me <action>`
- **Permission**: Level 0 (readonly)
- **Visibility**: All players
- **Format**: `* Username action`
- **Use Case**: Roleplay actions

```
/me waves to the crowd
# Displays as: * Steve waves to the crowd
```

### Private Messages (Targeted Players Only)

#### `/msg` / `/tell` / `/w` / `/whisper` Commands
- **Syntax**: `/msg <player> <message>`
- **Permission**: Level 0 (readonly)
- **Visibility**: Only specified player(s)
- **Format**: Whisper style message
- **Use Case**: Private player-to-player communication

```
/msg @p Welcome to the server!
/tell Steve You've been chosen for a quest.
/w @a[team=red] Your team is winning!
```

All four commands are aliases and function identically.

#### `/tellraw` Command
- **Syntax**: `/tellraw <targets> <json_message>`
- **Permission**: Level 2 (mob)
- **Visibility**: Only specified targets
- **Format**: Fully customizable JSON text
- **Use Case**: Rich formatted messages with colors, hover effects, click actions

```
/tellraw @p {"text":"Click here for quest","color":"gold","bold":true,"clickEvent":{"action":"run_command","value":"/trigger quest_start"}}

/tellraw @a[distance=..5] [{"text":"[NPC] ","color":"green"},{"text":"Hello traveler! ","color":"white"},{"text":"[Talk]","color":"yellow","underlined":true,"clickEvent":{"action":"suggest_command","value":"/trigger talk"}}]
```

**JSON Text Features:**
- `color`: Color name or hex code
- `bold`, `italic`, `underlined`, `strikethrough`, `obfuscated`: Text formatting
- `clickEvent`: Run command, suggest command, open URL, etc.
- `hoverEvent`: Show tooltip on hover
- `insertion`: Insert text when shift-clicked

### Comparison Table

| Command | Public/Private | Permission | JSON Support | Use Case |
|---------|---------------|------------|--------------|----------|
| `/say` | Public | Level 2 | No | Announcements |
| `/me` | Public | Level 0 | No | Roleplay actions |
| `/msg`/`/tell` | Private | Level 0 | No | Simple private messages |
| `/tellraw` | Private | Level 2 | Yes | Rich NPC dialogue |
| `/title` | Private | Level 2 | Yes | Large screen titles |

### Best Practices for AI NPCs

**For dialogue from NPCs:**
Use `/tellraw` for rich, interactive dialogue:
```
/execute as @e[tag=AI_NPC,name="[AI] Merchant"] at @s run tellraw @a[distance=..3] [{"text":"[Merchant] ","color":"gold"},{"text":"Would you like to trade? ","color":"white"},{"text":"[Yes]","color":"green","clickEvent":{"action":"run_command","value":"/trigger trade"}},{"text":" [No]","color":"red"}]
```

**For quick responses:**
Use `/msg` or `/tell` for simple text:
```
/execute as @e[tag=AI_NPC] at @s run msg @p[distance=..5] Hello there!
```

**For notifications:**
Use `/title` with actionbar for non-intrusive messages:
```
/title @p actionbar {"text":"Quest Updated: Speak to the Elder","color":"yellow"}
```

---

## Proximity Detection

Proximity detection is essential for AI NPCs to respond to nearby players.

### Method 1: Distance Selector Argument

The most straightforward method uses the `distance` argument in selectors:

```
@a[distance=..5]      # All players within 5 blocks
@a[distance=5..10]    # Players 5-10 blocks away
@a[distance=10..]     # Players 10+ blocks away
```

**Distance Calculation:**
- Uses Euclidean (straight-line) distance
- Formula: `sqrt(dx² + dy² + dz²)`
- Measured from entity's feet position
- Distance is in blocks

**Examples:**
```
# Check if any player is nearby
/execute as @e[tag=AI_NPC] at @s if entity @a[distance=..5] run say Someone is close!

# Run command for each nearby player
/execute as @e[tag=AI_NPC] at @s as @a[distance=..3] run tellraw @s {"text":"Welcome!"}

# Count nearby players
/execute as @e[tag=AI_NPC] at @s store result score @s nearby_count run execute if entity @a[distance=..10]
```

### Method 2: Rectangular Detection (dx, dy, dz)

For rectangular/cuboid detection areas, use `dx`, `dy`, `dz`:

```
# Detect players in a 10×5×10 box
/execute positioned ~-5 ~ ~-5 if entity @a[dx=10,dy=5,dz=10] run say Player in area!
```

**How it works:**
- `x`, `y`, `z` specify the lower northwest corner
- `dx`, `dy`, `dz` specify the size of the box
- More efficient than distance for rectangular areas

**Example:**
```
# Detect players in front of NPC (5 blocks forward, 3 blocks wide)
/execute as @e[tag=AI_NPC] at @s positioned ^ ^ ^1 if entity @a[dx=3,dy=2,dz=5] run say Someone ahead!
```

### Method 3: Storing Distance in Scoreboard

For more complex distance-based logic:

```
# Calculate distance using scoreboard math
/scoreboard objectives add distance dummy
/scoreboard objectives add temp dummy

# Get positions
/execute store result score @s temp run data get entity @s Pos[0] 100
/execute store result score @p temp run data get entity @p Pos[0] 100
# ... calculate difference and distance using operations
```

**Note**: This is complex and usually unnecessary. Use selector `distance=` when possible.

### Method 4: Raycasting (Line of Sight)

To detect if NPC can "see" a player:

```
# Simple raycast - check if player is in front and close
/execute as @e[tag=AI_NPC] at @s anchored eyes facing entity @p[distance=..10] eyes positioned ^ ^ ^0.5 if entity @p[distance=..0.5] run say I see you!

# More precise raycast with recursion (using function)
# Function mypack:raycast.mcfunction
execute positioned ^ ^ ^0.5 unless block ~ ~ ~ #minecraft:transparent run return 0
execute positioned ^ ^ ^0.5 if entity @p[distance=..1] run return run say Found player!
execute if score @s raycast_dist matches ..20 run function mypack:raycast
```

### Method 5: Proximity Trigger with Scoreboard

Track when players enter/leave range:

```
# Setup
/scoreboard objectives add near_npc dummy

# Every tick
/execute as @a at @s if entity @e[tag=AI_NPC,distance=..5] run scoreboard players add @s near_npc 1
/execute as @a at @s unless entity @e[tag=AI_NPC,distance=..5] run scoreboard players set @s near_npc 0

# Trigger on first detection (score changes from 0 to 1)
/execute as @a[scores={near_npc=1}] run tellraw @s {"text":"You approach the NPC...","color":"gray"}
```

### Practical Examples for AI NPCs

**Greet player when they approach:**
```
/execute as @e[tag=AI_NPC,tag=!greeted] at @s if entity @a[distance=..3] run function mypack:npc_greet
/execute as @e[tag=AI_NPC,tag=greeted] at @s unless entity @a[distance=..3] run tag @s remove greeted
```

**Different responses based on distance:**
```
# Very close (0-2 blocks)
/execute as @e[tag=AI_NPC] at @s as @a[distance=..2] run tellraw @s {"text":"You're too close!","color":"red"}

# Close (2-5 blocks)
/execute as @e[tag=AI_NPC] at @s as @a[distance=2..5] run tellraw @s {"text":"Hello there!","color":"green"}

# Medium (5-10 blocks)
/execute as @e[tag=AI_NPC] at @s as @a[distance=5..10] run tellraw @s {"text":"Come closer...","color":"gray"}
```

**Alert NPC when player is behind them:**
```
/execute as @e[tag=AI_NPC] at @s rotated ~ 0 positioned ^ ^ ^-2 if entity @a[distance=..2] run say Someone behind me!
```

**Detect sneaking player nearby:**
```
/execute as @e[tag=AI_NPC] at @s if entity @a[distance=..5,nbt={Sneaking:1b}] run say I hear sneaking...
```

### Performance Considerations

1. **Use limits**: `@a[distance=..10,limit=1]` instead of `@a[distance=..10]` when you only need one
2. **Sort efficiently**: `sort=nearest` is faster when combined with `limit`
3. **Reduce frequency**: Don't check every tick if you don't need to
4. **Use tags**: Tag entities in range instead of re-checking constantly
5. **Rectangular vs Spherical**: `dx/dy/dz` is faster than `distance` for box-shaped areas

---

## Chat Bubbles and Floating Text

Displaying text above entities (like chat bubbles) enhances the NPC interaction experience. There are several approaches:

### Method 1: Vanilla Custom Names

The simplest vanilla method uses entity CustomName:

```
# Set custom name above entity
/data merge entity @e[tag=AI_NPC,limit=1] {CustomName:'{"text":"Hello!","color":"white"}',CustomNameVisible:1b}

# Update dynamically
/execute as @e[tag=AI_NPC] at @s if entity @a[distance=..5] run data merge entity @s {CustomName:'{"text":"Can I help you?","color":"aqua"}',CustomNameVisible:1b}

# Hide when no players nearby
/execute as @e[tag=AI_NPC] at @s unless entity @a[distance=..5] run data merge entity @s {CustomNameVisible:0b}
```

**Limitations:**
- Only one line of text
- Limited formatting
- Can't show/hide easily without changing CustomName
- Not ideal for dialogue

### Method 2: Armor Stands with Custom Names

Spawn invisible armor stands above the NPC to display text:

```
# Summon floating text armor stand
/summon armor_stand ~ ~2 ~ {CustomName:'{"text":"Press E to talk","color":"yellow"}',CustomNameVisible:1b,NoGravity:1b,Invisible:1b,Invulnerable:1b,Marker:1b,Tags:["text_display","npc_bubble"]}

# Make it follow NPC
/execute as @e[tag=AI_NPC] at @s run tp @e[tag=npc_bubble,sort=nearest,limit=1] ~ ~2 ~

# Remove when done
/kill @e[tag=npc_bubble]
```

**Advantages:**
- Multiple lines (stack multiple armor stands)
- Easy to spawn/remove
- Can be positioned precisely

**Disadvantages:**
- Requires entity management
- Performance impact with many NPCs
- Still limited formatting

### Method 3: Display Entities (1.19.4+)

Minecraft 1.19.4+ added text_display entities specifically for floating text:

```
# Summon text display
/summon text_display ~ ~2 ~ {Tags:["npc_text"],text:'{"text":"Hello, traveler!","color":"gold","bold":true}',billboard:"center",see_through:1b,background:0}

# Make it follow NPC
/execute as @e[tag=AI_NPC] at @s positioned ~ ~2 ~ run tp @e[tag=npc_text,sort=nearest,limit=1] ~ ~ ~ ~ ~

# Multi-line text
/summon text_display ~ ~2 ~ {text:'{"text":"Welcome!\\nHow can I help?","color":"aqua"}',billboard:"center"}
```

**Display Entity Options:**
- `billboard`: How it rotates ("fixed", "vertical", "horizontal", "center")
- `see_through`: Whether visible through blocks
- `background`: Background color (0 for transparent, other for colored background)
- `line_width`: Maximum line width before wrapping
- `text_opacity`: Transparency of text
- `shadow`: Whether to show shadow

**Advantages:**
- Purpose-built for text display
- Better performance than armor stands
- Rich formatting options
- Proper text rendering

### Method 4: Fabric Mods (Client-Side Enhancement)

For the best chat bubble experience, several Fabric mods are available:

#### **TalkBubbles** (Recommended)
- Adds bubbles above heads when players chat
- Client-sided with Cloth Config dependency
- Works on Fabric 1.18.2+
- Command: Standard chat triggers bubbles

#### **TalkingClouds** (Most Flexible)
- Speech bubbles for players AND any entity
- Command: `/talkcloud` to add bubble to any entity
- Requires: Fabric API, Cloth Config API, Fabric Permissions API
- Supports 1.18.2 and 1.19.2

**Example usage:**
```
/talkcloud @e[tag=AI_NPC] "Hello there!" 100
# Shows "Hello there!" above NPC for 100 ticks (5 seconds)
```

#### **Chat Bubbles** (AppleDash)
- Displays chat messages as bubbles above player heads
- MMO-style chat bubbles
- Requires Fabric Launcher and Fabric API
- Automatic on chat messages

#### **Talk Balloons** (Cross-Platform)
- Available for Forge, Fabric, and NeoForge
- Client-side mod
- Automatic bubble display on chat

#### **Notable Bubble Text (NBT)**
- In-game chat bubbles
- Configurable appearance
- Works with command-triggered text

### Method 5: Combination Approach (Best for AI NPCs)

Combine vanilla commands with client-side mods:

**Server-side (vanilla commands):**
```
# 1. Use title/actionbar for prompts (no mod needed)
/execute as @e[tag=AI_NPC] at @s as @a[distance=..3] run title @s actionbar {"text":"[E] Talk to NPC","color":"yellow"}

# 2. Use tellraw for actual dialogue
/execute as @e[tag=AI_NPC] at @s as @a[distance=..3,scores={talk_trigger=1..}] run tellraw @s [{"text":"[NPC] ","color":"green"},{"text":"Hello! How can I help you?","color":"white"}]

# 3. Use text_display entities for persistent labels
/summon text_display ~ ~2 ~ {Tags:["npc_label"],text:'{"text":"[AI] Merchant","color":"gold"}',billboard:"center"}
```

**Client-side (with TalkingClouds mod):**
```
# Server can trigger mod's visual bubbles
/talkcloud @e[tag=AI_NPC,sort=nearest,limit=1] "Welcome to my shop!" 80
```

### Implementation Recommendations for AI NPC System

**For general NPC labels (name tags):**
- Use CustomName with CustomNameVisible:1b
- Simple, no overhead
- Always visible

**For interaction prompts:**
- Use actionbar titles: Non-intrusive, appears above hotbar
- `/title @p actionbar {"text":"..."}`

**For dialogue/conversation:**
- Use tellraw with formatted JSON for rich text
- Add clickable options with clickEvent

**For visual chat bubbles (if mod available):**
- Use TalkingClouds mod with `/talkcloud` command
- Provides MMO-style experience

**For persistent info displays:**
- Use text_display entities (1.19.4+)
- Better performance than armor stands
- Clean text rendering

**Example complete interaction flow:**
```mcfunction
# 1. Player approaches - show actionbar prompt
execute as @e[tag=AI_NPC] at @s as @a[distance=..4] run title @s actionbar {"text":"[E] Talk to Merchant","color":"yellow"}

# 2. Player triggers (using scoreboard trigger)
execute as @a[scores={talk_npc=1..}] at @s as @e[tag=AI_NPC,distance=..5,limit=1] at @s run function mypack:npc_dialogue

# In function mypack:npc_dialogue.mcfunction:
# 3. Show bubble (if mod present)
talkcloud @s "Greetings, traveler!" 60

# 4. Show dialogue in chat
tellraw @a[distance=..5] [{"text":"[Merchant] ","color":"gold","bold":true},{"text":"Greetings, traveler! ","color":"white"},{"text":"What brings you here?","color":"gray"}]

# 5. Reset trigger
scoreboard players reset @a[scores={talk_npc=1..}] talk_npc
```

---

## Commands for NPC Interactions

Here's a comprehensive list of commands most useful for AI NPC systems:

### Essential Commands

#### **Communication**
```
# Rich dialogue with clickable options
/tellraw @p [{"text":"[NPC] ","color":"green"},{"text":"Choose: ","color":"white"},{"text":"[Quest]","color":"gold","clickEvent":{"action":"run_command","value":"/trigger quest"}},{"text":" [Shop]","color":"aqua","clickEvent":{"action":"run_command","value":"/trigger shop"}}]

# Simple message
/msg @p Hello traveler!

# Title overlay
/title @p title {"text":"Quest Complete!","color":"gold"}
/title @p subtitle {"text":"+100 XP","color":"yellow"}
/title @p actionbar {"text":"New quest available nearby","color":"gray"}
```

#### **Item Management**
```
# Give quest reward
/give @p minecraft:diamond 5

# Check inventory for quest item
/execute if entity @p[nbt={Inventory:[{id:"minecraft:emerald",Count:10b}]}] run function mypack:quest_complete

# Take items (clear)
/clear @p minecraft:emerald 10

# Give custom item with NBT
/give @p diamond_sword{display:{Name:'{"text":"Legendary Blade","color":"gold","italic":false}'},Enchantments:[{id:"sharpness",lvl:10}]} 1
```

#### **Entity Spawning**
```
# Summon quest enemy
/summon zombie ~ ~ ~ {CustomName:'{"text":"Quest Boss"}',Health:100f,Attributes:[{Name:"generic.max_health",Base:100}],Tags:["quest_enemy"]}

# Summon NPC
/summon armor_stand ~ ~ ~ {CustomName:'{"text":"[AI] Guide","color":"aqua"}',NoGravity:1b,ShowArms:1b,Tags:["AI_NPC","guide"]}

# Summon particle effect
/particle minecraft:heart ~ ~2 ~ 0.3 0.3 0.3 0 10
```

#### **Effects & Buffs**
```
# Give player speed boost
/effect give @p minecraft:speed 60 1

# Heal player
/effect give @p minecraft:instant_health 1 2
/effect give @p minecraft:regeneration 10 1

# Clear negative effects
/effect clear @p minecraft:poison
/effect clear @p  # Clear all effects
```

#### **World Interaction**
```
# Place quest marker block
/setblock ~ ~ ~ minecraft:beacon

# Fill area (create structure)
/fill ~-2 ~ ~-2 ~2 ~5 ~2 minecraft:stone_bricks hollow

# Clone structure (spawn building)
/clone 100 64 100 110 74 110 ~ ~ ~

# Particle trail
/particle minecraft:end_rod ~ ~1 ~ 0.1 0.5 0.1 0.05 20
```

#### **Teleportation**
```
# Teleport player to quest location
/tp @p 100 64 200

# Teleport to NPC
/tp @p @e[tag=quest_giver,limit=1]

# Teleport NPC to player (follow)
/execute as @p at @s run tp @e[tag=follower_npc] ~ ~ ~ facing entity @s
```

#### **Sounds**
```
# Play quest completion sound
/playsound minecraft:entity.player.levelup master @p ~ ~ ~ 1 1

# Play dialogue sound
/playsound minecraft:entity.villager.yes neutral @p ~ ~ ~ 1 1

# Play ambient sound
/playsound minecraft:block.note_block.pling master @a ~ ~ ~ 1 2
```

### Scoreboard & State Management

```
# Create quest tracking
/scoreboard objectives add quest_progress dummy
/scoreboard objectives add quest_stage dummy

# Update quest progress
/scoreboard players add @p quest_progress 1
/scoreboard players set @p quest_stage 2

# Check progress
/execute if score @p quest_progress matches 10.. run function mypack:quest_reward

# Create trigger for player interaction (players can use)
/scoreboard objectives add talk_npc trigger
/scoreboard players enable @a talk_npc
/execute as @a[scores={talk_npc=1..}] run function mypack:player_talked
/scoreboard players reset @a talk_npc
```

### Data Queries

```
# Get player position
/execute store result score @p pos_x run data get entity @p Pos[0]

# Get player health
/execute store result score @p health run data get entity @p Health

# Check if player has item
/execute if data entity @p Inventory[{id:"minecraft:compass"}] run say You have a compass!

# Check player gamemode
/execute if data entity @p {playerGameType:0} run say You're in survival mode
```

### Advanced Interactions

#### **Proximity-Based Actions**
```
# Detect player approaching
/execute as @e[tag=AI_NPC] at @s if entity @a[distance=..5] unless entity @a[distance=..5,tag=greeted] run function mypack:greet_player
/tag @a[distance=..5] add greeted

# Reset when player leaves
/execute as @e[tag=AI_NPC] at @s unless entity @a[distance=..10] run tag @a remove greeted
```

#### **Dialogue Trees**
```
# Stage 1
/execute as @a[scores={dialogue_stage=1}] run tellraw @s [{"text":"[NPC] ","color":"green"},{"text":"Are you a hero? ","color":"white"},{"text":"[Yes]","color":"green","clickEvent":{"action":"run_command","value":"/trigger dialogue_yes"}},{"text":" [No]","color":"red","clickEvent":{"action":"run_command","value":"/trigger dialogue_no"}}]

# Stage 2 (if yes)
/execute as @a[scores={dialogue_yes=1..}] run scoreboard players set @s dialogue_stage 2
/execute as @a[scores={dialogue_stage=2}] run tellraw @s {"text":"[NPC] Excellent! I have a quest for you.","color":"green"}
```

#### **Quest System Example**
```
# Setup
/scoreboard objectives add quest_active dummy
/scoreboard objectives add quest_kills dummy

# Start quest
/scoreboard players set @p quest_active 1
/scoreboard players set @p quest_kills 0
/tellraw @p {"text":"Quest Started: Defeat 5 zombies","color":"gold"}

# Track kills (run when zombie dies)
/execute as @a[scores={quest_active=1}] run scoreboard players add @s quest_kills 1

# Complete quest
/execute as @a[scores={quest_active=1,quest_kills=5..}] run function mypack:quest_complete
```

### Performance Best Practices

1. **Use tags liberally**: Faster than NBT checks
2. **Limit entity selectors**: Use `limit=1` and `sort=nearest` when appropriate
3. **Use functions**: Organize complex logic in function files
4. **Reduce execution frequency**: Not everything needs to run every tick
5. **Clean up**: Remove temporary entities and scores when done
6. **Use execute efficiently**: Chain subcommands instead of multiple execute calls

---

## Complete Example: AI NPC with Quest

Here's a complete example combining all concepts:

### Setup (run once)
```mcfunction
# Create objectives
scoreboard objectives add quest_stage dummy
scoreboard objectives add talk_npc trigger
scoreboard players enable @a talk_npc

# Summon NPC
summon armor_stand 100 64 100 {CustomName:'{"text":"[AI] Quest Giver","color":"gold"}',NoGravity:1b,ShowArms:1b,Tags:["AI_NPC","quest_giver"],Invisible:0b}

# Add floating name
summon text_display 100 66 100 {text:'{"text":"[AI] Quest Giver\\n","color":"gold","bold":true}{"text":"[E] Talk","color":"yellow"}',billboard:"center",Tags:["npc_display"]}
```

### Main Loop (runs every tick)
```mcfunction
# Proximity detection - show actionbar prompt
execute as @e[tag=quest_giver] at @s as @a[distance=..4] run title @s actionbar {"text":"Press [E] to talk to Quest Giver","color":"yellow"}

# Handle player interaction
execute as @a[scores={talk_npc=1..}] at @s if entity @e[tag=quest_giver,distance=..5] run function mypack:quest_giver_talk
scoreboard players reset @a[scores={talk_npc=1..}] talk_npc

# Check quest progress
execute as @a[scores={quest_stage=1}] if entity @s[nbt={Inventory:[{id:"minecraft:diamond",Count:5b}]}] run function mypack:quest_complete
```

### Dialogue Function (mypack:quest_giver_talk.mcfunction)
```mcfunction
# Check if player already has quest
execute if score @s quest_stage matches 1.. run tellraw @s {"text":"[Quest Giver] You already have my quest. Bring me 5 diamonds!","color":"gold"}

# Start quest
execute unless score @s quest_stage matches 1.. run tellraw @s [{"text":"[Quest Giver] ","color":"gold","bold":true},{"text":"Greetings, brave adventurer! I need your help. Will you accept my quest? ","color":"white"},{"text":"[Accept]","color":"green","clickEvent":{"action":"run_command","value":"/trigger accept_quest"}},{"text":" [Decline]","color":"red"}]

# Play sound
playsound minecraft:entity.villager.yes neutral @s ~ ~ ~ 1 1

# Show bubble (if mod present)
execute as @e[tag=quest_giver,sort=nearest,limit=1] run talkcloud @s "Need 5 diamonds!" 60
```

### Quest Complete Function (mypack:quest_complete.mcfunction)
```mcfunction
# Take items
clear @s minecraft:diamond 5

# Give reward
give @s minecraft:diamond_sword{display:{Name:'{"text":"Heroic Blade","color":"aqua","italic":false}'},Enchantments:[{id:"sharpness",lvl:3}]} 1
xp add @s 100 points

# Message
tellraw @s [{"text":"Quest Complete!","color":"gold","bold":true},{"text":"\\n+100 XP\\n+Heroic Blade","color":"yellow"}]
title @s title {"text":"QUEST COMPLETE","color":"gold"}

# Effects
effect give @s minecraft:regeneration 10 1
playsound minecraft:ui.toast.challenge_complete master @s ~ ~ ~ 1 1
particle minecraft:totem_of_undying ~ ~1 ~ 0.5 0.5 0.5 0.1 50

# Update stage
scoreboard players set @s quest_stage 2
```

---

## Summary

This research document provides a comprehensive guide to Minecraft Java Edition 1.20+ commands for building an AI NPC system. Key takeaways:

1. **Permission System**: Use level 2 (gamemaster) for most NPC actions
2. **Execute Command**: Essential for context switching and conditionals
3. **Entity Selectors**: Use `distance`, `tag`, `type`, and `nbt` for flexible targeting
4. **NPC Detection**: Tag entities with `AI_NPC` for easy filtering
5. **Data Queries**: Use `/data get` to query player state (inventory, health, position)
6. **Messages**: Use `/tellraw` for rich dialogue, `/msg` for simple messages
7. **Proximity**: Use `distance=..X` selector for range detection
8. **Chat Bubbles**: Use text_display entities (1.19.4+) or Fabric mods (TalkingClouds)
9. **Scoreboards**: Track quest progress and NPC state
10. **Triggers**: Allow players to interact with NPCs using `/trigger` commands

The CSV file (`minecraft-commands.csv`) contains a complete reference of 60+ commands with syntax, permission levels, and examples.

For the AI NPC system, the most important command patterns are:
- `execute as @e[tag=AI_NPC] at @s if entity @a[distance=..5] run ...`
- `tellraw @p [JSON formatted dialogue with clickEvents]`
- `scoreboard` for tracking state and quest progress
- `data get entity @p` for querying player information
- `trigger` objectives for player-initiated interactions
