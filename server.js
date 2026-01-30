const http = require("http");
const fs = require("fs");
const path = require("path");

// ===== DEADLINE CONFIG =====
let deadline = new Date("2026-02-01T20:00:00Z").getTime(); // initial deadline
let extended = false;
const EXTENSION_MS = 24 * 60 * 60 * 1000; // 1 day

// Secret key to view logs (change this to something only you know)
const LOG_SECRET_KEY = "mySuperSecretKey123";

const PORT = process.env.PORT || 3000;

// ===== LOGGING FUNCTION =====
const logEvent = (message) => {
  const timestamp = new Date().toISOString();
  const line = `[${timestamp}] ${message}\n`;
  fs.appendFile("activity.log", line, (err) => {
    if (err) console.error("Logging error:", err);
  });
};

// ===== SERVER =====
const server = http.createServer((req, res) => {
  const now = Date.now();

  // -------- LOG PAGE VISIT --------
  if (req.url === "/" || req.url.startsWith("/index.html")) {
    logEvent(`Page visited: ${req.socket.remoteAddress}`);
  }

  // -------- API: get countdown status --------
  if (req.url === "/api/status") {
    const remaining = deadline - now;
    const isOpen = remaining > 0;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      open: isOpen,
      remaining: Math.max(remaining, 0),
      extended
    }));
    return;
  }

  // -------- API: extend deadline (single-use) --------
  if (req.url === "/api/extend") {
    if (now >= deadline) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Deadline has passed ❌" }));
      return;
    }

    if (extended) {
      res.writeHead(429, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "You already used your one-time extension ⏳" }));
      return;
    }

    // Apply one-time extension
    deadline += EXTENSION_MS;
    extended = true;

    // Log extension
    logEvent(`Deadline extended by visitor: ${req.socket.remoteAddress}`);

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Deadline extended by 1 day ✅", newDeadline: deadline }));
    return;
  }

  // -------- API: view logs (secret) --------
  if (req.url.startsWith("/api/logs")) {
    const urlParams = new URL(req.url, `http://${req.headers.host}`);
    const key = urlParams.searchParams.get("key");

    if (key !== LOG_SECRET_KEY) {
      res.writeHead(403);
      res.end("Forbidden");
      return;
    }

    fs.readFile("activity.log", "utf8", (err, data) => {
      if (err) {
        res.writeHead(500);
        res.end("Error reading logs");
        return;
      }
      res.writeHead(200, { "Content-Type": "text/plain" });
      res.end(data);
    });
    return;
  }

  // -------- Serve frontend files --------
  let filePath = req.url === "/" ? "/index.html" : req.url;
  filePath = path.join(__dirname, "public", filePath);

  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }

    let ext = path.extname(filePath);
    let contentType = "text/html";
    if (ext === ".css") contentType = "text/css";
    if (ext === ".js") contentType = "text/javascript";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });

});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});