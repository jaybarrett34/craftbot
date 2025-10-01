import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

// Sample Minecraft console logs
const minecraftLogs = [
  { id: 1, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Starting minecraft server version 1.20.1', source: 'Server' },
  { id: 2, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Loading properties', source: 'Server' },
  { id: 3, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Default game type: SURVIVAL', source: 'Server' },
  { id: 4, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Generating keypair', source: 'Server' },
  { id: 5, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Starting Minecraft server on *:25565', source: 'Server' },
  { id: 6, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Preparing level "world"', source: 'Server' },
  { id: 7, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Preparing start region for dimension minecraft:overworld', source: 'Server' },
  { id: 8, timestamp: new Date().toISOString(), level: 'INFO', message: '[Worker-Main-1/INFO]: Preparing spawn area: 0%', source: 'Server' },
  { id: 9, timestamp: new Date().toISOString(), level: 'INFO', message: '[Worker-Main-2/INFO]: Preparing spawn area: 47%', source: 'Server' },
  { id: 10, timestamp: new Date().toISOString(), level: 'INFO', message: '[Worker-Main-3/INFO]: Preparing spawn area: 83%', source: 'Server' },
  { id: 11, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Time elapsed: 3847 ms', source: 'Server' },
  { id: 12, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Done (4.234s)! For help, type "help"', source: 'Server' },
  { id: 13, timestamp: new Date().toISOString(), level: 'INFO', message: '[User Authenticator #1/INFO]: UUID of player Steve is 069a79f4-44e9-4726-a5be-fca90e38aaf5', source: 'Server' },
  { id: 14, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Steve[/127.0.0.1:54321] logged in with entity id 123 at (0.5, 64.0, 0.5)', source: 'Player' },
  { id: 15, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Steve joined the game', source: 'Player' },
  { id: 16, timestamp: new Date().toISOString(), level: 'INFO', message: '<Steve> Hello world!', source: 'Chat' },
  { id: 17, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Steve issued server command: /gamemode creative', source: 'Command' },
  { id: 18, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Set own game mode to Creative Mode', source: 'Command' },
  { id: 19, timestamp: new Date().toISOString(), level: 'WARN', message: '[Server thread/WARN]: Can\'t keep up! Is the server overloaded? Running 2034ms or 40 ticks behind', source: 'Performance' },
  { id: 20, timestamp: new Date().toISOString(), level: 'INFO', message: '<Steve> /give @s diamond 64', source: 'Chat' },
  { id: 21, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Gave 64 [Diamond] to Steve', source: 'Command' },
  { id: 22, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Steve has made the advancement [Diamonds!]', source: 'Advancement' },
  { id: 23, timestamp: new Date().toISOString(), level: 'INFO', message: '<Alex> /tp Steve ~ ~10 ~', source: 'Chat' },
  { id: 24, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Teleported Steve to 0.5, 74.0, 0.5', source: 'Command' },
  { id: 25, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Alex[/127.0.0.1:54322] logged in with entity id 456 at (10.5, 64.0, 10.5)', source: 'Player' },
  { id: 26, timestamp: new Date().toISOString(), level: 'INFO', message: '<Alex> Hey Steve!', source: 'Chat' },
  { id: 27, timestamp: new Date().toISOString(), level: 'INFO', message: '<Steve> Hi Alex!', source: 'Chat' },
  { id: 28, timestamp: new Date().toISOString(), level: 'WARN', message: '[Server thread/WARN]: Skipping Entity with id minecraft:zombie', source: 'Entity' },
  { id: 29, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Saving the game (this may take a moment!)', source: 'Server' },
  { id: 30, timestamp: new Date().toISOString(), level: 'INFO', message: '[Server thread/INFO]: Saved the game', source: 'Server' },
];

let logs = [...minecraftLogs];
let logIdCounter = 31;

// Default config
const defaultConfig = {
  entities: [
    {
      id: "console",
      name: "Server Console",
      type: "console",
      enabled: true,
      permissions: {
        canExecuteCommands: true,
        allowedCommands: ["*"],
        deniedCommands: [],
        accessLevel: "admin"
      },
      context: {
        systemPrompt: "You are the Minecraft server console with full administrative access.",
        worldState: {
          canSeeNearbyPlayers: true,
          canSeeNearbyNPCs: true,
          canSeeNearbyMobs: true,
          perceptionRadius: -1
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
  }
};

let config = { ...defaultConfig };

// Simulate new logs coming in
setInterval(() => {
  const randomMessages = [
    { level: 'INFO', message: `[Server thread/INFO]: Automatic saving is now enabled`, source: 'Server' },
    { level: 'INFO', message: `<Steve> Mining some diamonds`, source: 'Chat' },
    { level: 'INFO', message: `[Server thread/INFO]: [RCON] Command received: list`, source: 'RCON' },
    { level: 'INFO', message: `[Server thread/INFO]: There are 2 of a max of 20 players online: Steve, Alex`, source: 'Server' },
    { level: 'WARN', message: `[Server thread/WARN]: Can't keep up! Running ${Math.floor(Math.random() * 3000)}ms behind`, source: 'Performance' },
    { level: 'INFO', message: `<Alex> Found a village!`, source: 'Chat' },
    { level: 'INFO', message: `[Server thread/INFO]: Steve has made the advancement [Stone Age]`, source: 'Advancement' },
    { level: 'ERROR', message: `[Server thread/ERROR]: Encountered an unexpected exception`, source: 'Error' },
  ];

  const randomLog = randomMessages[Math.floor(Math.random() * randomMessages.length)];
  const newLog = {
    id: logIdCounter++,
    timestamp: new Date().toISOString(),
    level: randomLog.level,
    message: randomLog.message,
    source: randomLog.source
  };

  logs.push(newLog);
  if (logs.length > 100) {
    logs = logs.slice(-100); // Keep last 100
  }
}, 5000); // Add new log every 5 seconds

// API Routes
app.get('/api/logs', (req, res) => {
  res.json(logs);
});

app.get('/api/config', (req, res) => {
  res.json(config);
});

app.put('/api/config', (req, res) => {
  config = req.body;
  res.json({ success: true, config });
});

app.get('/api/entities', (req, res) => {
  res.json(config.entities);
});

app.post('/api/entities', (req, res) => {
  const newEntity = req.body;
  config.entities.push(newEntity);
  res.json({ success: true, entity: newEntity });
});

app.put('/api/entities/:id', (req, res) => {
  const { id } = req.params;
  const updatedEntity = req.body;
  const index = config.entities.findIndex(e => e.id === id);
  if (index !== -1) {
    config.entities[index] = updatedEntity;
    res.json({ success: true, entity: updatedEntity });
  } else {
    res.status(404).json({ error: 'Entity not found' });
  }
});

app.delete('/api/entities/:id', (req, res) => {
  const { id } = req.params;
  config.entities = config.entities.filter(e => e.id !== id);
  res.json({ success: true });
});

app.post('/api/rcon/command', (req, res) => {
  const { command } = req.body;
  const newLog = {
    id: logIdCounter++,
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: `[RCON] Command: ${command}`,
    source: 'RCON'
  };
  logs.push(newLog);
  res.json({ success: true, output: `Executed: ${command}` });
});

app.get('/api/server/status', (req, res) => {
  res.json({
    online: true,
    players: 2,
    maxPlayers: 20,
    version: '1.20.1',
    tps: 19.8
  });
});

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Mock API server running on http://localhost:${PORT}`);
  console.log(`Logs endpoint: http://localhost:${PORT}/api/logs`);
});
