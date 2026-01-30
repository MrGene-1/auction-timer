const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const actionBtn = document.getElementById("actionBtn");

let auctionClosed = false;

function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
}

// Animate countdown smoothly
async function updateStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();

    if (!data.open) {
      auctionClosed = true;
      statusEl.textContent = "Auction Closed 🔒";
      timerEl.textContent = "00:00:00";
      actionBtn.disabled = true;
      return;
    }

    statusEl.textContent = "Auction Open 🔥";
    timerEl.textContent = formatTime(data.remaining);
  } catch (err) {
    console.error("Error fetching status:", err);
  }
}

// Action button
actionBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/action");
    const data = await res.json();
    messageEl.textContent = data.message;
  } catch (err) {
    messageEl.textContent = "Error connecting to server";
  }
});

// Smooth 1-second updates
setInterval(() => {
  if (!auctionClosed) updateStatus();
}, 1000);

updateStatus();