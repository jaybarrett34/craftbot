export const defaultConfig = {
  entities: [
    {
      id: "console",
      name: "Server Console",
      type: "console",
      enabled: true,
      permissions: {
        canExecuteCommands: true,
        allowedCommands: ["*"], // All commands
        deniedCommands: [],
        accessLevel: "admin"
      },
      context: {
        systemPrompt: "You are the Minecraft server console with full administrative access. You can execute any command and monitor all server activity.",
        worldState: {
          canSeeNearbyPlayers: true,
          canSeeNearbyNPCs: true,
          canSeeNearbyMobs: true,
          perceptionRadius: -1 // Unlimited
        }
      },
      llm: {
        model: "llama2",
        temperature: 0.3,
        enabled: false
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
    defaultModel: "llama2",
    timeout: 30000
  },
  logging: {
    level: "info",
    file: "craftbot.log",
    console: true
  }
};

export const entityTypes = ["console", "npc", "player"];
export const accessLevels = ["readonly", "user", "mod", "admin"];

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
