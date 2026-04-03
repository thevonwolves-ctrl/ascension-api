const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, "players.json");

function readPlayers() {
  try {
    if (!fs.existsSync(DATA_FILE)) {
      fs.writeFileSync(DATA_FILE, JSON.stringify({}, null, 2), "utf8");
    }
    return JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));
  } catch (error) {
    console.error("Failed to read players.json:", error);
    return {};
  }
}

function writePlayers(players) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(players, null, 2), "utf8");
}

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type"
  });
  res.end(JSON.stringify(data));
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    req.on("data", chunk => {
      body += chunk;
    });
    req.on("end", () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        reject(err);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);

  if (req.method === "OPTIONS") {
    return sendJson(res, 200, { ok: true });
  }

  if (req.method === "GET" && url.pathname === "/") {
    return sendJson(res, 200, { ok: true, message: "Ascension API LIVE" });
  }

  if (req.method === "GET" && url.pathname === "/players") {
    return sendJson(res, 200, { players: readPlayers() });
  }

  if (req.method === "GET" && url.pathname.startsWith("/player/")) {
    const name = decodeURIComponent(url.pathname.replace("/player/", "")).toLowerCase();
    const players = readPlayers();

    if (!players[name]) {
      return sendJson(res, 404, { error: "Player not found" });
    }

    return sendJson(res, 200, players[name]);
  }

  if (req.method === "POST" && url.pathname === "/register") {
    try {
      const body = await parseBody(req);
      const { name, class: playerClass, channel, status, level, health, maxHealth } = body;

      if (!name) {
        return sendJson(res, 400, { error: "Missing player name" });
      }

      const players = readPlayers();
      const key = name.toLowerCase();

      players[key] = {
        name,
        class: playerClass || "Human",
        channel: channel || "global",
        status: status || "Active",
        level: level || 1,
        health: health || 90,
        maxHealth: maxHealth || 90,
        updatedAt: Date.now()
      };

      writePlayers(players);
      return sendJson(res, 200, { ok: true, player: players[key] });
    } catch (error) {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
  }

  if (req.method === "POST" && url.pathname === "/set-channel") {
    try {
      const body = await parseBody(req);
      const { name, channel, status } = body;

      if (!name || !channel) {
        return sendJson(res, 400, { error: "Missing name or channel" });
      }

      const players = readPlayers();
      const key = name.toLowerCase();

      if (!players[key]) {
        return sendJson(res, 404, { error: "Player not found" });
      }

      players[key].channel = channel;
      if (status) players[key].status = status;
      players[key].updatedAt = Date.now();

      writePlayers(players);
      return sendJson(res, 200, { ok: true, player: players[key] });
    } catch (error) {
      return sendJson(res, 400, { error: "Invalid JSON body" });
    }
  }

  return sendJson(res, 404, { error: "Not found" });
});

server.listen(PORT, () => {
  console.log(`Ascension API running on port ${PORT}`);
});