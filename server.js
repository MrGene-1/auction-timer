const http = require("http");
const fs = require("fs");
const path = require("path");

// ===== AUCTION CONFIG =====
// Set your auction end time (UTC)
const auctionEndTime = new Date("2026-02-01T12:00:00Z").getTime();

// ===== SERVER CONFIG =====
const PORT = process.env.PORT || 3000; // Works locally and on hosting platforms

// ===== CREATE SERVER =====
const server = http.createServer((req, res) => {

  // -------- API: get auction status --------
  if (req.url === "/api/status") {
    const now = Date.now();
    const remaining = auctionEndTime - now;
    const isOpen = remaining > 0;

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({
      open: isOpen,
      remaining: Math.max(remaining, 0)
    }));
    return;
  }

  // -------- API: attempt an action (simulate a bid) --------
  if (req.url === "/api/action") {
    const now = Date.now();

    if (now >= auctionEndTime) {
      res.writeHead(403, { "Content-Type": "application/json" });
      res.end(JSON.stringify({ message: "Auction closed 🔒" }));
      return;
    }

    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ message: "Action accepted ✅" }));
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

    // Serve CSS or JS with correct content type
    let ext = path.extname(filePath);
    let contentType = "text/html";
    if (ext === ".css") contentType = "text/css";
    if (ext === ".js") contentType = "text/javascript";

    res.writeHead(200, { "Content-Type": contentType });
    res.end(data);
  });

});

// ===== START SERVER =====
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});