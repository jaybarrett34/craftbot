export const defaultConfig = {
  entities: [
    {
      id: "console",
      name: "Server Console",
      type: "console",
      enabled: true,
      permissions: {
        level: "admin", // admin, mod, environment, readonly
        whitelistedCommands: ["*"],
        blacklistedCommands: [],
        canExecuteCommands: true
      },
      knowledge: {
        canAccessPlayerState: ["health", "position", "inventory", "gamemode"],
        canAccessWorldState: ["time", "weather", "entities"],
        proximityRequired: false, // console hears everything
        maxProximity: null,
        chatFilters: {
          respondToPlayers: true,      // Respond to player messages
          respondToAI: false,           // Respond to other AI entities
          requiresMention: false,       // Only respond if entity name mentioned
          proximityRequired: false,     // Already exists at parent level, kept for backward compatibility
          maxProximity: null            // Already exists at parent level, kept for backward compatibility
        }
      },
      personality: {
        characterContext: `You are the Minecraft server console with full administrative access. You can execute any command and monitor all server activity.`,
        conversationHistoryLimit: 50,
        useSummarization: true
      },
      llm: {
        model: "qwen2.5:14b-instruct",
        enabled: true,
        temperature: 0.7
      },
      appearance: {
        spawnCommand: null, // console doesn't spawn
        chatBubble: false,
        usesServerChat: true
      },
      mcpTools: {
        minecraft_send_message: true,
        minecraft_run_command: true,
        minecraft_get_chat_history: true,
        minecraft_search_history: true,
        minecraft_get_player_info: true,
        minecraft_get_server_status: true
      }
    }
  ],
  server: {
    rconHost: "localhost",
    rconPort: 25575,
    rconPassword: "",
    logPath: "/server/logs/latest.log",
    autoReconnect: true,
    reconnectDelay: 5000
  },
  rag: {
    chromadbUrl: "http://localhost:8000",
    collectionName: "minecraft_chat_history",
    embeddingModel: "all-MiniLM-L6-v2",
    maxResults: 10
  },
  ollama: {
    baseUrl: "http://localhost:11434",
    defaultModel: "qwen2.5:14b-instruct",
    timeout: 30000
  },
  logging: {
    level: "info",
    file: "craftbot.log",
    console: true
  }
};

export const entityTypes = ["console", "npc", "player"];

export const permissionLevels = [
  {
    value: "readonly",
    label: "Read Only",
    description: "Can only observe and read information. Cannot execute any commands."
  },
  {
    value: "environment",
    label: "Environment",
    description: "Can execute non-destructive environment commands (time, weather, etc.)."
  },
  {
    value: "mod",
    label: "Moderator",
    description: "Can execute player management commands (kick, ban, teleport)."
  },
  {
    value: "admin",
    label: "Admin",
    description: "Full access to all commands and server operations."
  }
];

export const playerStateFields = [
  { value: "health", label: "Health" },
  { value: "position", label: "Position" },
  { value: "inventory", label: "Inventory" },
  { value: "gamemode", label: "Game Mode" },
  { value: "effects", label: "Status Effects" },
  { value: "experience", label: "Experience" }
];

export const worldStateFields = [
  { value: "time", label: "World Time" },
  { value: "weather", label: "Weather" },
  { value: "entities", label: "Nearby Entities" },
  { value: "blocks", label: "Nearby Blocks" },
  { value: "biome", label: "Biome" }
];

export const availableMCPTools = [
  {
    name: "minecraft_send_message",
    description: "Send a chat message to the server",
    requiresPermission: "canExecuteCommands"
  },
  {
    name: "minecraft_run_command",
    description: "Execute a Minecraft command",
    requiresPermission: "canExecuteCommands"
  },
  {
    name: "minecraft_get_chat_history",
    description: "Retrieve recent chat messages",
    requiresPermission: null
  },
  {
    name: "minecraft_search_history",
    description: "Search chat history using RAG",
    requiresPermission: null
  },
  {
    name: "minecraft_get_player_info",
    description: "Get information about online players",
    requiresPermission: null
  },
  {
    name: "minecraft_get_server_status",
    description: "Get server status and statistics",
    requiresPermission: null
  }
];

export const commonMinecraftCommands = [
  "say", "tell", "msg", "give", "teleport", "tp", "summon", "kill",
  "gamemode", "gm", "time", "weather", "difficulty", "setworldspawn",
  "spawnpoint", "effect", "enchant", "xp", "clear", "setblock", "fill",
  "clone", "execute", "function", "scoreboard", "team", "tag", "data",
  "op", "deop", "ban", "pardon", "kick", "stop", "whitelist", "save-all"
];
