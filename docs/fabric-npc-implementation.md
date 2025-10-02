# Fabric NPC Implementation Guide

## Table of Contents
1. [Fabric Mod Development Setup](#fabric-mod-development-setup)
2. [RCON Server Configuration](#rcon-server-configuration)
3. [NPC Spawning Commands](#npc-spawning-commands)
4. [Chat Event Interception](#chat-event-interception)
5. [Proximity Detection Methods](#proximity-detection-methods)
6. [World and Player State Queries](#world-and-player-state-queries)
7. [Floating Text and Chat Bubbles](#floating-text-and-chat-bubbles)
8. [Access Level Recommendations](#access-level-recommendations)

---

## Fabric Mod Development Setup

### Prerequisites

**Required Software:**
- Java Development Kit (JDK) 21 or newer (required for Minecraft 1.20.5+)
  - Download from: https://adoptium.net/releases.html
- Java IDE (IntelliJ IDEA or Eclipse recommended)

**Current Versions (2025):**
- Fabric Loader: 0.16.14 (latest stable)
- Fabric Loom: 1.10+ (for Minecraft 1.21.6)
- Minecraft: 1.21.6+

### Setup Steps

1. **Install IntelliJ IDEA's Minecraft Development Plugin**
   - Navigate to: File → Settings → Plugins
   - Search for "Minecraft Development"
   - Install and restart IDE

2. **Create New Project**
   - Use IntelliJ IDEA's generator with the Minecraft Development plugin
   - Or use the online template generator at https://fabricmc.net/develop/

3. **Configure Build Files**
   - Update `build.gradle` with current versions:
     - Minecraft version
     - Mappings version
     - Fabric Loader version
     - Fabric Loom version
   - Query current versions at: https://fabricmc.net/develop/

4. **Add Fabric API Dependency**
   - Fabric API is highly recommended for cross-compatibility and additional hooks
   - Some wiki tutorials implicitly require Fabric API
   - Add to `build.gradle` dependencies

### Key Resources
- Official Documentation: https://docs.fabricmc.net
- Fabric Wiki: https://wiki.fabricmc.net
- Fabric API GitHub: https://github.com/FabricMC/fabric
- Example Mod Repository: Available on FabricMC GitHub

---

## RCON Server Configuration

RCON (Remote Console) is a TCP/IP-based protocol that allows external applications to remotely execute Minecraft server commands. This is essential for AI-controlled NPCs to interact with the game world.

### Enabling RCON

**Configuration File:** `server.properties`

**Required Settings:**
```properties
enable-rcon=true
rcon.port=25575
rcon.password=your_secure_password_here
```

**Important Notes:**
- Default RCON port is 25575 (can be customized)
- Choose a strong password for security
- Must restart server after configuration changes
- Successful startup shows: "RCON running on IP Address:Port" in console

### RCON Protocol Limitations
- Maximum outgoing packet size: 1460 bytes
- Maximum command size: 1446 bytes
- Can execute any standard Minecraft server command available to operators

### RCON Command Execution
RCON doesn't have separate commands - it executes standard Minecraft server commands remotely, including:
- Player management: `/kick`, `/ban`, `/gamemode`
- World management: `/time`, `/weather`, `/gamerule`
- Entity operations: `/summon`, `/tp`, `/kill`
- Administration: `/list`, `/save-all`, `/whitelist`

---

## NPC Spawning Commands

### Basic Summon Command Syntax

**At Current Location:**
```
/summon <entity_type>
```

**At Specific Coordinates:**
```
/summon <entity_type> <x> <y> <z>
```

**At Player Location:**
```
/execute as <player> at @s run summon <entity_type> ~ ~ ~
```

**Spawn 7 blocks in front of player:**
```
/execute as <player> at @s run summon <entity_type> ^ ^ ^7
```

### Coordinate Notations
- `~ ~ ~`: Relative to command execution position
- `^ ^ ^`: Relative to entity's facing direction
- Absolute coordinates: Exact X Y Z values

### Spawning NPCs with [AI] Name Tag

**Basic Villager with Custom Name:**
```
/summon villager ~ ~ ~ {CustomName:'{"text":"[AI] Bob"}'}
```

**With Name Always Visible:**
```
/summon villager ~ ~ ~ {CustomName:'{"text":"[AI] Bob"}',CustomNameVisible:1b}
```

**With Specific Profession and Level:**
```
/summon villager ~ ~ ~ {VillagerData:{profession:farmer,level:2,type:plains},CustomName:'{"text":"[AI] Sarah"}',CustomNameVisible:1b}
```

### Villager Appearance Customization

**VillagerData NBT Structure:**
```
VillagerData:{
  profession:<profession>,
  level:<1-5>,
  type:<biome_type>
}
```

**Available Professions:**
- `none` (default)
- `armorer`
- `butcher`
- `cartographer`
- `cleric`
- `farmer`
- `fisherman`
- `fletcher`
- `leatherworker`
- `librarian`
- `mason`
- `nitwit`
- `shepherd`
- `toolsmith`
- `weaponsmith`

**Available Biome Types:**
- `plains` (standard appearance)
- `desert`
- `jungle`
- `savanna`
- `snow`
- `swamp`
- `taiga`

**Level:** Integer from 1-5 (affects trading tier, appearance badges)

### Advanced NPC Configuration

**Immobile NPC (cannot move):**
```
/summon villager ~ ~ ~ {CustomName:'{"text":"[AI] Guard"}',CustomNameVisible:1b,NoAI:1b}
```

**Invulnerable NPC (cannot be damaged):**
```
/summon villager ~ ~ ~ {CustomName:'{"text":"[AI] Guide"}',CustomNameVisible:1b,Invulnerable:1b}
```

**Persistent NPC (never despawns):**
```
/summon villager ~ ~ ~ {CustomName:'{"text":"[AI] Shopkeeper"}',CustomNameVisible:1b,PersistenceRequired:1b}
```

**Combined Example - Perfect AI NPC:**
```
/summon villager ~ ~ ~ {
  VillagerData:{profession:librarian,level:5,type:plains},
  CustomName:'{"text":"[AI] Scholar","color":"aqua"}',
  CustomNameVisible:1b,
  NoAI:1b,
  Invulnerable:1b,
  PersistenceRequired:1b
}
```

### Equipment/Armor (for other mob types)

For armor stands or other mobs that support equipment:
```
/summon armor_stand ~ ~ ~ {
  CustomName:'{"text":"[AI] Knight"}',
  CustomNameVisible:1b,
  ShowArms:1b,
  Equipment:[
    {id:"diamond_boots",Count:1},
    {id:"diamond_leggings",Count:1},
    {id:"diamond_chestplate",Count:1},
    {id:"diamond_helmet",Count:1},
    {id:"diamond_sword",Count:1}
  ]
}
```

---

## Chat Event Interception

### Fabric API Events

Fabric provides comprehensive chat event APIs in the following packages:
- `net.fabricmc.fabric.api.message.v1` (server-side)
- `net.fabricmc.fabric.api.client.message.v1` (client-side)

### Server-Side Chat Events

**Listening to Player Chat Messages:**
```java
import net.fabricmc.fabric.api.message.v1.ServerMessageEvents;

// In your mod initialization
ServerMessageEvents.ALLOW_CHAT_MESSAGE.register((message, sender, params) -> {
    String messageText = message.getContent().getString();
    String playerName = sender.getName().getString();

    // Check if message is directed at an [AI] NPC
    if (messageText.startsWith("[AI]")) {
        // Process AI message
        handleAIChat(sender, messageText);
    }

    return true; // Return false to block the message
});
```

**Modifying Chat Messages:**
```java
import net.fabricmc.fabric.api.message.v1.ServerMessageDecoratorEvent;

ServerMessageDecoratorEvent.EVENT.register(ServerMessageDecoratorEvent.CONTENT_PHASE, (sender, message) -> {
    // Modify message content
    return message; // Return modified Text component
});
```

### Client-Side Chat Events

**Receiving Messages:**
```java
import net.fabricmc.fabric.api.client.message.v1.ClientReceiveMessageEvents;

ClientReceiveMessageEvents.GAME.register((message, overlay) -> {
    String messageText = message.getString();

    // Process received message
    if (messageText.contains("[AI]")) {
        // Handle AI response
    }
});
```

**Sending Messages:**
```java
import net.fabricmc.fabric.api.client.message.v1.ClientSendMessageEvents;

ClientSendMessageEvents.ALLOW_CHAT.register((message) -> {
    // Intercept before sending
    return true; // Return false to block
});
```

### Detecting [AI] Tagged NPCs in Chat

**Filter Pattern Matching:**
```java
import java.util.regex.Pattern;
import java.util.regex.Matcher;

private static final Pattern AI_NPC_PATTERN = Pattern.compile("\\[AI\\]\\s+(\\w+)");

private void processChatMessage(String message) {
    Matcher matcher = AI_NPC_PATTERN.matcher(message);
    if (matcher.find()) {
        String npcName = matcher.group(1);
        // This message is from/to an AI NPC
        handleAINPCMessage(npcName, message);
    }
}
```

### Sending Chat Messages from Mod

**Public Chat Message:**
```java
import net.minecraft.server.network.ServerPlayerEntity;
import net.minecraft.text.Text;

public void sendPublicMessage(ServerPlayerEntity player, String message) {
    player.getServer().getPlayerManager().broadcast(
        Text.literal(message),
        false
    );
}
```

**Private Message to Player:**
```java
public void sendPrivateMessage(ServerPlayerEntity player, String message) {
    player.sendMessage(Text.literal(message), false);
}
```

**Executing /msg Command:**
```java
import net.minecraft.server.command.ServerCommandSource;

public void sendPrivateCommand(ServerCommandSource source, String targetPlayer, String message) {
    String command = String.format("msg %s %s", targetPlayer, message);
    source.getServer().getCommandManager().execute(source, command);
}
```

### Chat Commands (Vanilla)

**Private Message:**
```
/msg <player> <message>
/tell <player> <message>
/w <player> <message>
```

All three commands are aliases and send private messages to specific players.

---

## Proximity Detection Methods

### Using Target Selectors with Distance

**Basic Distance Selector Syntax:**
```
@e[distance=<range>]
```

**Range Formats:**
- `distance=5` - Exactly 5 blocks away
- `distance=..5` - Up to 5 blocks away (0 to 5)
- `distance=5..` - 5 blocks or more away
- `distance=5..10` - Between 5 and 10 blocks away
- `distance=0.01..10` - Very close to 10 blocks (excludes self at 0)

### Detecting Players Near NPCs

**Find players within 10 blocks of any [AI] NPC:**
```
/execute as @e[type=villager,name="[AI]*"] at @s if entity @a[distance=..10] run say Player nearby!
```

**Count players within radius:**
```
/execute as @e[type=villager,name="[AI]*"] at @s store result score @s playerCount if entity @a[distance=..10]
```

**Execute command for each nearby player:**
```
/execute as @e[type=villager,name="[AI]*"] at @s as @a[distance=..10] run say Hello from AI NPC!
```

### Detecting NPCs Near Players

**Find [AI] NPCs within 20 blocks:**
```
/execute as @a at @s if entity @e[type=villager,name="[AI]*",distance=..20] run say AI NPC nearby!
```

**Get closest AI NPC:**
```
/execute as @a at @s run effect give @e[type=villager,name="[AI]*",distance=..20,limit=1,sort=nearest] glowing 10
```

### Detecting Specific Named NPCs

**Find specific NPC by full name:**
```
@e[type=villager,name="[AI] Bob"]
```

**Important Limitation:** Multi-word names in selectors can be problematic. Best practice is to use scoreboard tags.

**Using Tags Instead:**
```
# Tag the NPC at spawn
/tag @e[type=villager,name="[AI] Bob"] add ai_bob

# Later detect using tag
@e[type=villager,tag=ai_bob]
```

### Advanced Proximity Detection

**Detect if player is looking at NPC:**
```
/execute as @a at @s anchored eyes facing entity @e[type=villager,name="[AI]*",limit=1,sort=nearest] eyes anchored feet positioned ^ ^ ^1 rotated as @s positioned ^ ^ ^-1 if entity @s[distance=..0.3] run say Looking at AI!
```

**Detect NPCs in specific area:**
```
/execute as @a at @s if entity @e[type=villager,name="[AI]*",x=100,y=64,z=200,dx=20,dy=10,dz=20] run say AI in designated area!
```

### Fabric Mod Proximity Detection

**Getting nearby entities in code:**
```java
import net.minecraft.entity.Entity;
import net.minecraft.util.math.Box;
import net.minecraft.world.World;
import java.util.List;

public List<Entity> getNearbyNPCs(World world, Entity center, double radius) {
    Box box = new Box(
        center.getX() - radius, center.getY() - radius, center.getZ() - radius,
        center.getX() + radius, center.getY() + radius, center.getZ() + radius
    );

    return world.getEntitiesByClass(Entity.class, box, entity -> {
        String name = entity.getCustomName() != null ?
            entity.getCustomName().getString() : "";
        return name.startsWith("[AI]");
    });
}
```

---

## World and Player State Queries

### Player State Data

#### Health
**Using Scoreboard:**
```
# Create health objective
/scoreboard objectives add health health

# Health is automatically tracked (read-only)
# View player's health
/scoreboard players get <player> health
```

**Using Data Command:**
```
/data get entity <player> Health
```

**Using Execute Store:**
```
/execute store result score <player> health run data get entity <player> Health
```

#### Hunger (Food Level)
**Using Scoreboard:**
```
# Create food objective
/scoreboard objectives add hunger food

# Hunger is automatically tracked (read-only)
/scoreboard players get <player> hunger
```

**Using Data Command:**
```
/data get entity <player> foodLevel
```

#### Experience (XP)
**Query XP Level:**
```
/xp query <player> levels
```

**Query XP Points:**
```
/xp query <player> points
```

**Using Data Command:**
```
/data get entity <player> XpLevel
/data get entity <player> XpTotal
```

#### Position
**Get All NBT Data (includes position):**
```
/data get entity <player> Pos
```

**Output format:** `[x, y, z]` as doubles

**Using Execute Store:**
```
/execute store result score <player> posX run data get entity <player> Pos[0]
/execute store result score <player> posY run data get entity <player> Pos[1]
/execute store result score <player> posZ run data get entity <player> Pos[2]
```

#### Gamemode
**Using Data Command:**
```
/data get entity <player> playerGameType
```

**Returns:** Integer (0=survival, 1=creative, 2=adventure, 3=spectator)

#### Inventory
**Get Full Inventory:**
```
/data get entity <player> Inventory
```

**Count Specific Item:**
```
/execute as <player> store result score @s itemCount run clear @s minecraft:diamond 0
```

**Check for Item with NBT:**
```
/execute if entity <player>[nbt={Inventory:[{id:"minecraft:diamond_sword",Count:1b}]}] run say Has diamond sword!
```

### Additional Player Data

**Scoreboard Criteria for Auto-Tracking:**
- `health` - Current health (half-hearts)
- `food` - Hunger level (0-20)
- `level` - Experience level
- `air` - Underwater air (0-300)
- `armor` - Armor points (0-20)
- `deathCount` - Number of deaths
- `playerKillCount` - Players killed
- `totalKillCount` - Total kills

**Create Tracking Objective:**
```
/scoreboard objectives add <name> <criterion>
/scoreboard objectives setdisplay sidebar <name>
```

### World State Data

#### Time
**Query Current Time:**
```
/time query daytime
/time query gametime
/time query day
```

**Set Time:**
```
/time set <time>
/time set day
/time set night
/time set noon
/time set midnight
```

#### Weather
**Query Weather (Bedrock Edition):**
```
/weather query
```

**Set Weather:**
```
/weather clear [duration]
/weather rain [duration]
/weather thunder [duration]
```

#### Biome
**Locate Biome:**
```
/locate biome <biome_id>
```

**Get Biome at Position:**
```
# Use F3 debug screen or external tools
# No direct command in vanilla
```

**Fill Biome (Change):**
```
/fillbiome <from_x> <from_y> <from_z> <to_x> <to_y> <to_z> <biome>
```

### Nearby Entity Queries

**List All Entities in Radius:**
```
/execute as @a at @s run say @e[distance=..20,type=!player]
```

**Count Entities:**
```
/execute as @a at @s store result score @s entityCount if entity @e[distance=..20]
```

**Filter by Type:**
```
/execute as @a at @s if entity @e[type=zombie,distance=..20] run say Zombies nearby!
```

**Get Nearest Entity:**
```
@e[type=<type>,limit=1,sort=nearest]
```

### Using Execute Store for Advanced Queries

**Store Command Success:**
```
/execute store success score <target> <objective> run <command>
```

**Store Command Result:**
```
/execute store result score <target> <objective> run <command>
```

**Example - Store Player Count:**
```
/execute store result score @a playerCount if entity @a
```

**Example - Store Block Check:**
```
/execute as @a at @s store success score @s onGrass if block ~ ~-1 ~ grass_block
```

### Complete Player Data via NBT

**Get All Player Data:**
```
/data get entity <player>
```

**Returns comprehensive NBT including:**
- Position (`Pos`)
- Rotation (`Rotation`)
- Motion (`Motion`)
- Health (`Health`)
- Food Level (`foodLevel`)
- Saturation (`foodSaturationLevel`)
- XP (`XpLevel`, `XpTotal`)
- Inventory (`Inventory`)
- Ender Chest (`EnderItems`)
- Selected Item (`SelectedItemSlot`)
- Dimension (`Dimension`)
- And much more...

---

## Floating Text and Chat Bubbles

### Text Display Entity (Minecraft 1.20+)

The modern approach for floating text uses the `text_display` entity introduced in Minecraft 1.20.

**Basic Text Display:**
```
/summon text_display ~ ~ ~ {text:'{"text":"Hello World"}'}
```

**Styled Text Display:**
```
/summon text_display ~ ~2 ~ {text:'{"text":"AI NPC Shop","bold":true,"color":"gold"}'}
```

**Multiple Lines:**
```
/summon text_display ~ ~2 ~ {text:'{"text":"Welcome to\\nThe AI Village\\n---"}'}
```

### Text Display Properties

**Key NBT Tags:**
- `text` - JSON text component
- `background` - Background color (ARGB integer)
- `billboard` - How text faces viewer
- `alignment` - Text alignment (left/center/right)
- `line_width` - Maximum line width
- `see_through` - Whether visible through blocks
- `shadow` - Whether text has shadow

**Billboard Options:**
- `"fixed"` - Fixed rotation
- `"vertical"` - Rotates horizontally only
- `"horizontal"` - Rotates vertically only
- `"center"` - Always faces viewer (default)

**Example with All Properties:**
```
/summon text_display ~ ~2 ~ {
  text:'{"text":"[AI] Bob\\nReady to Help","color":"aqua","bold":true}',
  billboard:"center",
  background:0,
  see_through:1b,
  line_width:200,
  alignment:"center"
}
```

### Chat Bubble Above NPC

**Position Above Entity:**
```
/execute as @e[type=villager,name="[AI] Bob"] at @s run summon text_display ~ ~2.5 ~ {text:'{"text":"Hello!"}'}
```

**Follow Entity (requires repeated execution):**
```
# In repeating command block or function
/execute as @e[type=villager,tag=ai_npc] at @s as @e[type=text_display,tag=npc_bubble,limit=1,sort=nearest] run tp @s ~ ~2.5 ~
```

### Legacy Method: Armor Stand (Pre-1.20)

**Invisible Armor Stand with Custom Name:**
```
/summon armor_stand ~ ~2 ~ {
  CustomName:'{"text":"[AI] Shopkeeper"}',
  CustomNameVisible:1b,
  Invisible:1b,
  NoGravity:1b,
  Marker:1b
}
```

### Chat Bubble Mods/Plugins

For more dynamic chat bubbles, consider these approaches:

**Notable Bubble Text (NBT) - Fabric Mod:**
- Adds text bubbles above player heads when they chat
- Displays recent messages as floating text

**Chat Display (Bubbles) - Plugin:**
- Shows chat messages as text displays above players
- Configurable duration and styling

**Text-Bubbles - Bukkit Plugin:**
- Shows messages above player heads
- Buffers multiple messages

### Dynamic Chat Bubbles via Mod

**In Fabric Mod Code:**
```java
import net.minecraft.entity.decoration.DisplayEntity;
import net.minecraft.text.Text;

public void showChatBubble(Entity npc, String message) {
    World world = npc.getWorld();

    // Create text display entity
    DisplayEntity.TextDisplayEntity textDisplay =
        new DisplayEntity.TextDisplayEntity(EntityType.TEXT_DISPLAY, world);

    textDisplay.setPosition(npc.getX(), npc.getY() + 2.5, npc.getZ());
    textDisplay.setText(Text.literal(message));
    textDisplay.setBillboardMode(DisplayEntity.BillboardMode.CENTER);

    world.spawnEntity(textDisplay);

    // Schedule removal after 5 seconds
    scheduleRemoval(textDisplay, 100); // 100 ticks = 5 seconds
}
```

---

## Access Level Recommendations

Based on the capabilities and potential risks, here are recommended access levels for different operations:

### Level 1: READONLY
**Description:** Can only query player and world state, cannot modify anything.

**Allowed Operations:**
- `/data get entity` - Read player/entity NBT data
- `/scoreboard players get` - Read scoreboard values
- `/time query` - Check time of day
- `/weather query` - Check weather (Bedrock)
- `/xp query` - Check player XP
- `/locate` - Find structures/biomes
- Target selectors for detection (no execution)
- Execute store (reading only)

**Use Cases:**
- Information gathering for AI responses
- Context-aware dialogue
- State monitoring
- Analytics and logging

**Risk Level:** Very Low
- Cannot grief or damage
- Cannot affect gameplay
- No direct player interaction

---

### Level 2: ENVIRONMENT
**Description:** Can modify world environment but not entities or players directly.

**Allowed Operations (in addition to READONLY):**
- `/time set` - Change time of day
- `/weather` - Change weather
- `/gamerule` - Modify game rules
- `/setworldspawn` - Set spawn point
- `/setblock` - Place single blocks
- `/fill` - Fill areas with blocks
- `/clone` - Copy block regions
- `/fillbiome` - Change biomes
- `/playsound` - Play sounds

**Prohibited:**
- Entity spawning
- Player teleportation
- Inventory modification
- Damage/healing

**Use Cases:**
- Dynamic world events
- Atmosphere control
- Building/construction
- Environmental storytelling

**Risk Level:** Low to Medium
- Can modify terrain
- Can affect ambiance
- Limited griefing potential (if restricted properly)
- No direct player harm

---

### Level 3: MOB
**Description:** Can spawn and modify entities, give items, but cannot force player actions.

**Allowed Operations (in addition to ENVIRONMENT):**
- `/summon` - Spawn entities (including NPCs)
- `/tp` (entities only) - Teleport NPCs/mobs
- `/kill` (entities only) - Remove entities
- `/give` - Give items to players
- `/clear` - Remove items from players
- `/effect` - Apply status effects
- `/experience` - Give/take XP
- `/tag` - Add entity tags
- Entity NBT modification
- `/particle` - Spawn particles

**Prohibited:**
- Forced player teleportation
- Direct player damage (via command)
- Operator/permission changes

**Use Cases:**
- AI NPC spawning and management
- Quest rewards
- Entity-based interactions
- Dynamic encounters
- Trading systems

**Risk Level:** Medium
- Can spawn dangerous mobs
- Can give overpowered items
- Can remove player items
- Can create lag with excessive entities
- Limited player autonomy impact

---

### Level 4: ADMIN
**Description:** Full command access with no restrictions.

**Allowed Operations (everything):**
- `/op` - Grant operator status
- `/deop` - Remove operator status
- `/kick` - Kick players
- `/ban` - Ban players
- `/pardon` - Unban players
- `/whitelist` - Modify whitelist
- `/gamemode` - Change player gamemode
- `/tp` (players) - Teleport players
- `/kill` (players) - Kill players
- `/difficulty` - Change difficulty
- `/stop` - Stop server
- All Level 1, 2, and 3 commands

**Use Cases:**
- Server administration
- Emergency moderation
- Debug operations
- Testing and development

**Risk Level:** Very High
- Can completely control server
- Can kick/ban players
- Can grant/revoke permissions
- Can stop server
- Potential for severe abuse

---

### Recommended Implementation

**Tiered Permission System:**

```java
public enum AccessLevel {
    READONLY(1),
    ENVIRONMENT(2),
    MOB(3),
    ADMIN(4);

    private final int level;

    AccessLevel(int level) {
        this.level = level;
    }

    public boolean allows(AccessLevel required) {
        return this.level >= required.level;
    }
}

public class CommandValidator {
    private static final Map<String, AccessLevel> COMMAND_PERMISSIONS = Map.of(
        "data get", AccessLevel.READONLY,
        "scoreboard players get", AccessLevel.READONLY,
        "time query", AccessLevel.READONLY,

        "time set", AccessLevel.ENVIRONMENT,
        "weather", AccessLevel.ENVIRONMENT,
        "setblock", AccessLevel.ENVIRONMENT,

        "summon", AccessLevel.MOB,
        "give", AccessLevel.MOB,
        "effect", AccessLevel.MOB,

        "op", AccessLevel.ADMIN,
        "kick", AccessLevel.ADMIN,
        "ban", AccessLevel.ADMIN
    );

    public boolean canExecute(String command, AccessLevel userLevel) {
        String commandName = extractCommandName(command);
        AccessLevel required = COMMAND_PERMISSIONS.getOrDefault(
            commandName,
            AccessLevel.ADMIN // Default to highest for unknown commands
        );
        return userLevel.allows(required);
    }
}
```

**Safe Defaults:**
- Start AI NPCs with READONLY access
- Require explicit configuration for higher levels
- Log all MOB and ADMIN level commands
- Implement rate limiting to prevent spam
- Add command whitelist/blacklist overrides

**Progressive Access:**
```
Player Experience -> AI Trust Level -> Access Level

New players        -> Untrusted      -> READONLY
Established        -> Trusted        -> ENVIRONMENT
Moderators         -> Elevated       -> MOB
Admins only        -> Full Control   -> ADMIN
```

---

## Security Considerations

### Command Injection Prevention
- Always sanitize user input before command execution
- Use parameterized command building, not string concatenation
- Validate entity selectors to prevent unintended targets
- Limit command length to prevent protocol abuse

### Rate Limiting
- Implement per-NPC command rate limits
- Throttle RCON connections
- Monitor command frequency patterns
- Automatic cooldowns on expensive operations

### Monitoring and Logging
- Log all commands above READONLY level
- Track command success/failure rates
- Alert on suspicious patterns
- Maintain audit trail for admin actions

### Fail-Safe Mechanisms
- Automatic access level reduction on abuse detection
- Emergency shutdown capability
- Command rollback for critical errors
- Whitelist mode for production environments

---

## Example Implementation: Complete AI NPC System

### 1. Spawn AI NPC with Identifier

```bash
# Spawn NPC with unique tag
/summon villager ~ ~ ~ {
  VillagerData:{profession:librarian,level:5,type:plains},
  CustomName:'{"text":"[AI] Scholar","color":"aqua"}',
  CustomNameVisible:1b,
  NoAI:1b,
  Invulnerable:1b,
  PersistenceRequired:1b,
  Tags:["ai_npc","ai_scholar"]
}

# Create scoreboard for tracking
/scoreboard objectives add ai_cooldown dummy
/scoreboard objectives add ai_active dummy
```

### 2. Detect Player Proximity

```bash
# In repeating command block (20Hz)
/execute as @e[type=villager,tag=ai_npc] at @s if entity @a[distance=..5] run tag @s add player_nearby
/execute as @e[type=villager,tag=ai_npc] at @s unless entity @a[distance=..5] run tag @s remove player_nearby
```

### 3. Listen for Chat Messages

```java
// In Fabric mod
ServerMessageEvents.ALLOW_CHAT_MESSAGE.register((message, sender, params) -> {
    String text = message.getContent().getString();
    ServerPlayerEntity player = sender;

    // Find nearby AI NPCs
    List<Entity> nearbyNPCs = getNearbyNPCs(player.getWorld(), player, 10.0);

    for (Entity npc : nearbyNPCs) {
        String npcName = npc.getCustomName().getString();
        // Send to AI service
        processAIInteraction(player, npcName, text);
    }

    return true;
});
```

### 4. AI Response Execution

```java
public void executeAIResponse(ServerPlayerEntity player, String npcName, AIResponse response) {
    ServerCommandSource commandSource = player.getServer().getCommandSource()
        .withSilent()
        .withLevel(2); // Gamemode level

    // Validate access level
    if (!validator.canExecute(response.command, AccessLevel.MOB)) {
        logger.warn("AI attempted unauthorized command: " + response.command);
        return;
    }

    // Send chat response
    sendNPCMessage(player, npcName, response.dialogue);

    // Execute game command if present
    if (response.command != null) {
        commandSource.getServer().getCommandManager()
            .execute(commandSource, response.command);
    }

    // Show chat bubble
    showChatBubble(getNPCByName(npcName), response.dialogue);
}
```

### 5. Create Chat Bubble

```bash
# Summon text display above NPC
/execute as @e[type=villager,tag=ai_scholar] at @s run summon text_display ~ ~2.5 ~ {
  text:'{"text":"Hello, traveler!","color":"white"}',
  billboard:"center",
  background:0,
  Tags:["ai_bubble","ai_scholar_bubble"]
}

# Remove after 5 seconds (100 ticks)
/schedule function remove_bubble 100t
```

### 6. Query Player State for Context

```bash
# Get player health for AI context
/execute as @a store result score @s health run data get entity @s Health

# Get hunger
/execute as @a store result score @s hunger run data get entity @s foodLevel

# Check inventory for quest item
/execute as @a store result score @s hasItem if entity @s[nbt={Inventory:[{id:"minecraft:diamond"}]}]
```

### 7. RCON Integration

```python
# Example Python RCON client for AI
from mcrcon import MCRcon

class MinecraftAI:
    def __init__(self, host, port, password):
        self.rcon = MCRcon(host, port, password)
        self.rcon.connect()

    def get_player_info(self, player):
        """Query player state"""
        health = self.rcon.command(f"data get entity {player} Health")
        hunger = self.rcon.command(f"data get entity {player} foodLevel")
        pos = self.rcon.command(f"data get entity {player} Pos")

        return {
            'health': self.parse_nbt(health),
            'hunger': self.parse_nbt(hunger),
            'position': self.parse_nbt(pos)
        }

    def npc_speak(self, player, npc_name, message):
        """Send message from NPC to player"""
        self.rcon.command(f"msg {player} <{npc_name}> {message}")

    def spawn_npc(self, x, y, z, name):
        """Spawn AI NPC at location"""
        cmd = f'summon villager {x} {y} {z} {{CustomName:\'{{\"text\":\"[AI] {name}\"}}\',CustomNameVisible:1b,NoAI:1b,Invulnerable:1b,PersistenceRequired:1b}}'
        return self.rcon.command(cmd)

    def give_reward(self, player, item, count):
        """Give quest reward"""
        return self.rcon.command(f"give {player} {item} {count}")
```

---

## Best Practices

### NPC Management
1. **Unique Identifiers:** Always tag NPCs with unique identifiers for targeting
2. **Name Conventions:** Use consistent `[AI]` prefix for easy filtering
3. **Persistence:** Set `PersistenceRequired:1b` to prevent despawning
4. **Invulnerability:** Consider making NPCs invulnerable for stability
5. **No AI:** Set `NoAI:1b` for stationary NPCs to reduce server load

### Performance Optimization
1. **Limit Entity Count:** Don't spawn excessive NPCs
2. **Efficient Selectors:** Use specific tags rather than broad name searches
3. **Reduce Command Frequency:** Don't run detection every tick if not needed
4. **Clean Up Entities:** Remove temporary entities (chat bubbles) after use
5. **Batch Operations:** Group related commands when possible

### Player Experience
1. **Clear Indicators:** Make AI NPCs visually distinct
2. **Response Time:** Minimize delay between player message and NPC response
3. **Context Awareness:** Use player state data for relevant interactions
4. **Natural Dialogue:** Avoid robotic command-like responses
5. **Failure Handling:** Gracefully handle errors without breaking immersion

### Security
1. **Access Control:** Implement tiered permission system
2. **Input Validation:** Sanitize all user input
3. **Rate Limiting:** Prevent command spam
4. **Audit Logging:** Track all privileged operations
5. **Fail-Safe:** Automatic shutdown on abuse detection

---

## Additional Resources

### Official Documentation
- Minecraft Commands Wiki: https://minecraft.wiki/w/Commands
- Fabric Documentation: https://docs.fabricmc.net
- Fabric API Javadocs: https://maven.fabricmc.net/docs/

### Community Resources
- Fabric Discord: Discord server for Fabric development
- Minecraft Commands Subreddit: r/MinecraftCommands
- Fabric Wiki: https://wiki.fabricmc.net

### Tools
- MCRcon: Python library for RCON
- mcrcon-cli: Command-line RCON client
- NBT Explorer: Tool for viewing/editing NBT data
- Minecraft Dev Plugin: IntelliJ plugin for mod development

---

## Conclusion

This guide provides a comprehensive foundation for implementing AI-controlled NPCs in Minecraft using Fabric mods and RCON. The system allows for:

- **Dynamic NPC Spawning:** Create AI characters with custom appearances and behaviors
- **Real-Time Interaction:** Listen to chat events and respond contextually
- **World Awareness:** Query player and world state for intelligent responses
- **Safe Operation:** Tiered access levels prevent abuse while enabling rich interactions
- **Scalability:** RCON integration allows external AI systems to control multiple NPCs

By following the recommended access levels and security practices, you can create immersive AI NPCs that enhance gameplay without compromising server stability or player safety.
