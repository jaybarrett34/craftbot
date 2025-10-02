# NBT Examples for Mob Spawner

This document provides examples of NBT (Named Binary Tag) data that can be used with the Advanced NBT Editor in the Mob Spawner component.

## Basic Syntax

The correct NBT format for Minecraft 1.21+ is:
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"MobName\"}]",
  "Health": 20.0,
  "Attributes": [...]
}
```

**Important:** The `CustomName` field uses JSON text components with escaped quotes.

## Built-in Presets

### 1. Basic (Custom Name)
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"YourMobName\"}]"
}
```
Just sets a custom name with the [AI] prefix.

### 2. Invulnerable
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"YourMobName\"}]",
  "Invulnerable": 1
}
```
Mob cannot be damaged or killed.

### 3. Glowing
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"YourMobName\"}]",
  "Glowing": 1
}
```
Mob has a glowing outline visible through walls.

### 4. Persistent (No Despawn)
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"YourMobName\"}]",
  "PersistenceRequired": 1
}
```
Mob will never despawn naturally.

### 5. Silent
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"YourMobName\"}]",
  "Silent": 1
}
```
Mob makes no sounds.

### 6. No AI (Statue)
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"YourMobName\"}]",
  "NoAI": 1
}
```
Mob stands completely still like a statue.

## Advanced Custom Examples

### Super Health Zombie
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"red\"},{\"text\":\"Tank\"}]",
  "Health": 100.0,
  "Attributes": [
    {
      "Name": "generic.max_health",
      "Base": 100.0
    }
  ],
  "PersistenceRequired": 1
}
```

### Fast Running Villager
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"green\"},{\"text\":\"Speedy\"}]",
  "Attributes": [
    {
      "Name": "generic.movement_speed",
      "Base": 0.5
    }
  ],
  "PersistenceRequired": 1
}
```

### Baby Zombie with Custom Equipment
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"gold\"},{\"text\":\"Warrior\"}]",
  "IsBaby": 1,
  "HandItems": [
    {
      "id": "minecraft:diamond_sword",
      "Count": 1
    },
    {}
  ],
  "ArmorItems": [
    {
      "id": "minecraft:diamond_boots",
      "Count": 1
    },
    {
      "id": "minecraft:diamond_leggings",
      "Count": 1
    },
    {
      "id": "minecraft:diamond_chestplate",
      "Count": 1
    },
    {
      "id": "minecraft:diamond_helmet",
      "Count": 1
    }
  ],
  "PersistenceRequired": 1
}
```

### Invisible Guardian
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"dark_purple\"},{\"text\":\"Watcher\"}]",
  "ActiveEffects": [
    {
      "Id": 14,
      "Amplifier": 0,
      "Duration": 999999,
      "ShowParticles": 0
    }
  ],
  "PersistenceRequired": 1
}
```
Note: Effect ID 14 is Invisibility

### Flying Horse (NoGravity)
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"light_purple\"},{\"text\":\"Pegasus\"}]",
  "NoGravity": 1,
  "Tame": 1,
  "Variant": 7,
  "PersistenceRequired": 1
}
```

### Creeper That Won't Explode
```json
{
  "CustomName": "[{\"text\":\"[AI] \",\"color\":\"yellow\"},{\"text\":\"Friendly Creeper\"}]",
  "ExplosionRadius": 0,
  "Fuse": 999999,
  "PersistenceRequired": 1
}
```

## Common NBT Tags Reference

### General Tags (All Mobs)
- `CustomName`: JSON text component for name
- `CustomNameVisible`: 1 to always show name, 0 to show only on hover
- `Health`: Current health value
- `Invulnerable`: 1 for invulnerable
- `PersistenceRequired`: 1 to prevent despawning
- `Silent`: 1 to mute all sounds
- `NoAI`: 1 to disable AI
- `NoGravity`: 1 to disable gravity
- `Glowing`: 1 to make mob glow
- `Fire`: Ticks the mob is on fire (-1 for immune)
- `Tags`: Array of string tags for scoreboard/command filtering

### Attributes (via Attributes array)
- `generic.max_health`: Maximum health
- `generic.movement_speed`: Movement speed (default ~0.23-0.7 depending on mob)
- `generic.attack_damage`: Attack damage
- `generic.armor`: Armor points
- `generic.knockback_resistance`: 0.0-1.0 knockback resistance
- `generic.follow_range`: How far mob can detect entities

### Status Effects (via ActiveEffects array)
Common Effect IDs:
- 1: Speed
- 2: Slowness
- 3: Haste
- 5: Strength
- 8: Jump Boost
- 10: Regeneration
- 11: Resistance
- 12: Fire Resistance
- 13: Water Breathing
- 14: Invisibility
- 16: Night Vision
- 21: Health Boost
- 22: Absorption
- 23: Saturation
- 25: Levitation
- 26: Glowing
- 28: Slow Falling

### Equipment (Zombies, Skeletons, etc.)
- `HandItems`: Array of 2 items [mainhand, offhand]
- `ArmorItems`: Array of 4 items [feet, legs, chest, head]
- `HandDropChances`: Array of 2 floats for drop chance
- `ArmorDropChances`: Array of 4 floats for drop chance

## Tips

1. **Always validate JSON** before spawning - use the "Format JSON" button
2. **Escape quotes properly** in CustomName fields
3. **Use numeric values** for boolean tags (1 for true, 0 for false)
4. **Test with basic presets first** before creating complex custom NBT
5. **Check Minecraft version compatibility** - some tags changed between versions

## Troubleshooting

### Issue: Mob spawns but name is JSON text
**Solution:** This was the original bug. Make sure you're using the proper format with escaped quotes:
```json
"CustomName": "[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"Name\"}]"
```
NOT:
```json
"CustomName": "'[{\"text\":\"[AI] \",\"color\":\"aqua\"},{\"text\":\"Name\"}]'"
```

### Issue: "Invalid NBT JSON format" error
**Solution:** Click "Format JSON" to check for syntax errors. Common issues:
- Missing commas between properties
- Unescaped quotes in strings
- Trailing commas at the end of arrays/objects

### Issue: Mob spawns but some attributes don't apply
**Solution:** 
- Check Minecraft wiki for correct tag names (case-sensitive)
- Some attributes require the mob to be the right type (e.g., `Tame` only works on horses/wolves)
- Values may have specific ranges (e.g., `Health` can't exceed `generic.max_health`)

## References

- [Minecraft Wiki - Entity Format](https://minecraft.wiki/w/Entity_format)
- [Minecraft Wiki - Commands/summon](https://minecraft.wiki/w/Commands/summon)
- [Minecraft Wiki - NBT Format](https://minecraft.wiki/w/NBT_format)

