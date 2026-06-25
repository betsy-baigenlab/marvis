const API = "http://localhost:5000";

// ── Clock ─────────────────────────────────────────────────────────────────
function updateClock() {
  const now = new Date();
  document.getElementById("clock").textContent =
    now.toLocaleTimeString("en-US", { hour12: false });
}
setInterval(updateClock, 1000);
updateClock();

// ── Status helpers ────────────────────────────────────────────────────────
function setStatus(text, color = "#00e5ff") {
  document.getElementById("statusText").textContent = text;
  document.getElementById("statusDot").style.background = color;
  document.getElementById("statusDot").style.boxShadow = `0 0 6px ${color}`;
}

// ── Chat helpers ──────────────────────────────────────────────────────────
function addMessage(who, text) {
  const panel = document.getElementById("chatInner");

  const wrapper = document.createElement("div");
  wrapper.className = `msg ${who === "YOU" ? "user-msg" : "marvis-msg"}`;

  const label = document.createElement("span");
  label.className = "msg-label";
  label.textContent = who;

  const bubble = document.createElement("div");
  bubble.className = "bubble";
  bubble.textContent = text;

  wrapper.appendChild(label);
  wrapper.appendChild(bubble);
  panel.appendChild(wrapper);
  scrollBottom();
  return wrapper;
}

function addTyping() {
  const panel = document.getElementById("chatInner");
  const wrapper = document.createElement("div");
  wrapper.className = "msg marvis-msg";
  wrapper.id = "typingIndicator";

  const label = document.createElement("span");
  label.className = "msg-label";
  label.textContent = "MARVIS";

  const bubble = document.createElement("div");
  bubble.className = "bubble typing-bubble";
  bubble.innerHTML = "<span></span><span></span><span></span>";

  wrapper.appendChild(label);
  wrapper.appendChild(bubble);
  panel.appendChild(wrapper);
  scrollBottom();
}

function removeTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

function scrollBottom() {
  const panel = document.getElementById("chatPanel");
  panel.scrollTop = panel.scrollHeight;
}

// ── Send command ──────────────────────────────────────────────────────────
async function sendCommand(text) {
  if (!text.trim()) return;

  addMessage("YOU", text);
  addTyping();
  setStatus("PROCESSING", "#7c4dff");

  try {
    const res = await fetch(`${API}/command`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text })
    });

    const data = await res.json();
    removeTyping();

    if (data.response) {
      addMessage("MARVIS", data.response);
    }

    setStatus("ONLINE");

  } catch (err) {
    removeTyping();
    addMessage("MARVIS", "⚠ Cannot reach Marvis server. Is server.py running?");
    setStatus("OFFLINE", "#ff1744");
  }
}

// ── Text input ────────────────────────────────────────────────────────────
function sendText() {
  const input = document.getElementById("textInput");
  const text = input.value.trim();
  if (!text) return;
  input.value = "";
  sendCommand(text);
}

// ── Mic (Web Speech API) ──────────────────────────────────────────────────
let recognition = null;

function startListening() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

  if (!SpeechRecognition) {
    addMessage("MARVIS", "Speech recognition is not supported in this browser. Use Chrome.");
    return;
  }

  const btn = document.getElementById("micBtn");

  if (recognition) {
    recognition.stop();
    return;
  }

  recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  recognition.interimResults = false;
  recognition.maxAlternatives = 1;

  btn.classList.add("listening");
  setStatus("LISTENING", "#ff1744");

  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript;
    sendCommand(transcript);
  };

  recognition.onerror = (event) => {
    addMessage("MARVIS", `Mic error: ${event.error}`);
    setStatus("ONLINE");
  };

  recognition.onend = () => {
    btn.classList.remove("listening");
    recognition = null;
    setStatus("ONLINE");
  };

  recognition.start();
}

// ── Clear memory ──────────────────────────────────────────────────────────
async function clearMemory() {
  await fetch(`${API}/memory/clear`, { method: "POST" });
  addMessage("MARVIS", "Memory cleared. Starting fresh.");
}
