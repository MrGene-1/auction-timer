const statusEl = document.getElementById("status");
const timerEl = document.getElementById("timer");
const messageEl = document.getElementById("message");
const actionBtn = document.getElementById("actionBtn");

let final = false;
let lastHourTriggered = false; // to play sound only once

// Load a subtle ticking/alarm sound
const audio = new Audio("ticking.mp3"); // place a small mp3 in /public

// Convert ms to HH:MM:SS
function formatTime(ms) {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return `${String(hours).padStart(2,"0")}:${String(minutes).padStart(2,"0")}:${String(seconds).padStart(2,"0")}`;
}

// Update countdown
async function updateStatus() {
  try {
    const res = await fetch("/api/status");
    const data = await res.json();

    if (!data.open) {
      final = true;
      statusEl.textContent = "Deadline Passed 🔒";
      timerEl.textContent = "00:00:00";
      actionBtn.disabled = true;
      timerEl.classList.remove("flash");
      return;
    }

    statusEl.textContent = "Deadline Active 🔥";
    timerEl.textContent = formatTime(data.remaining);

    // Flash red and play sound if less than 1 hour
    if (data.remaining <= 60 * 60 * 1000) {
      timerEl.classList.add("flash");

      if (!lastHourTriggered) {
        audio.play().catch(()=>{}); // ignore play errors in browser
        lastHourTriggered = true;
      }

    } else {
      timerEl.classList.remove("flash");
    }

    // Disable button if extension used
    if (data.extended) actionBtn.disabled = true;

  } catch (err) {
    console.error(err);
  }
}

// Extend button (single-use)
actionBtn.addEventListener("click", async () => {
  if (final) return;

  try {
    const res = await fetch("/api/extend");
    const data = await res.json();
    messageEl.textContent = data.message;

    if (res.status === 200) {
      actionBtn.disabled = true;
      updateStatus();
    }

  } catch (err) {
    messageEl.textContent = "Error connecting to server";
  }
});

// Interval update
setInterval(() => {
  if (!final) updateStatus();
}, 1000);

updateStatus();