const express = require("express");
const fs = require("fs");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const DATA_FILE = "./players.json";

// 🧠 Load players
function loadPlayers() {
  if (!fs.existsSync(DATA_FILE)) return {};
  return JSON.parse(fs.readFileSync(DATA_FILE));
}

// 💾 Save players
function savePlayers(data) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
}

// 🟢 ROOT TEST
app.get("/", (req, res) => {
  res.json({
    ok: true,
    message: "Ascension API LIVE"
  });
});

// 📊 GET ALL PLAYERS
app.get("/players", (req, res) => {
  const players = loadPlayers();
  res.json(players);
});

// ➕ CREATE / GET PLAYER
app.post("/player/:name", (req, res) => {
  const name = req.params.name.toLowerCase();
  const players = loadPlayers();

  if (!players[name]) {
    players[name] = {
      name,
      class: "human",
      level: 1,
      hp: 100,
      coins: 0,
      blood: 0,
      charm: 0,
      faith: 1,
      superstition: 1,
      owner: null,
      lastActive: Date.now()
    };
  }

  players[name].lastActive = Date.now();
  savePlayers(players);

  res.json(players[name]);
});

// 🧛 INFECTION SYSTEM
app.post("/bite", (req, res) => {
  const { attacker, target, type } = req.body;
  const players = loadPlayers();

  if (!players[attacker] || !players[target]) {
    return res.status(400).json({ error: "Player not found" });
  }

  let result = "failed";

  if (type === "werewolf") {
    const roll = Math.random();

    if (roll < 0.20) {
      players[target].class = "werewolf";
      result = "turned werewolf";
    } else if (roll < 0.95) {
      result = "mauled but survived";
    } else {
      players[target].status = "mutated";
      result = "strange mutation";
    }
  }

  if (type === "vampire") {
    const roll = Math.random();

    if (roll < 0.30) {
      players[target].class = "vampire";
      result = "turned vampire";
    } else {
      players[target].class = "blood_doll";
      result = "became blood doll";
    }
  }

  savePlayers(players);

  res.json({
    result,
    player: players[target]
  });
});

// 🧙 WITCH CHAOS
app.post("/witch/curse", (req, res) => {
  const { target } = req.body;
  const players = loadPlayers();

  if (!players[target]) {
    return res.status(400).json({ error: "Player not found" });
  }

  const curses = [
    "turned into a random animal for 24 hours",
    "grew a wart on their nose",
    "has two left feet (clumsy)",
    "drops coins randomly",
    "blinded briefly by hex",
    "random stat reduced"
  ];

  const curse = curses[Math.floor(Math.random() * curses.length)];

  players[target].status = curse;
  savePlayers(players);

  res.json({
    curse,
    player: players[target]
  });
});

// 🩸 BLOOD DOLL CLAIM
app.post("/claim", (req, res) => {
  const { owner, target } = req.body;
  const players = loadPlayers();

  if (!players[owner] || !players[target]) {
    return res.status(400).json({ error: "Player not found" });
  }

  if (players[target].class !== "blood_doll") {
    return res.status(400).json({ error: "Target is not a blood doll" });
  }

  players[target].owner = owner;
  savePlayers(players);

  res.json({
    message: `${owner} claimed ${target}`,
    target: players[target]
  });
});

// 🔍 FIND PLAYER (cost system placeholder)
app.post("/locate", (req, res) => {
  const { seeker, target } = req.body;
  const players = loadPlayers();

  if (!players[seeker] || !players[target]) {
    return res.status(400).json({ error: "Player not found" });
  }

  // future: cost system
  res.json({
    message: `${target} is somewhere in the shadows...`,
    target: players[target]
  });
});

// 🚀 SERVER START (RENDER COMPATIBLE)
const PORT = process.env.PORT || 3000;

app.listen(PORT, "0.0.0.0", () => {
  console.log(`Ascension API running on port ${PORT}`);
});
