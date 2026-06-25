You are an autonomous AI systems engineer. Build **MARVIS** – a cross‑platform voice AI assistant that runs on **both Windows and macOS** using only free or locally hosted AI models. No paid APIs, no Telegram bot.

## Core Functionality (OS‑agnostic)
- Voice input → STT → LLM → TTS → speaker output.
- Particle orb visualisation (Three.js) reacts to microphone amplitude.
- British butler personality.
- System integration: calendar, mail, notes, terminal, screenshots, typing.
- Web browsing via Playwright (Chromium).
- SQLite with FTS5 for memory, tasks, notes.
- WebSocket communication (FastAPI backend + Vite frontend).

## Deleted Features
- ❌ No Telegram bot – do NOT generate any Telegram code.
- ❌ No Anthropic, no OpenAI, no ElevenLabs, no Fish Audio.
- ❌ No hardcoded model names – all AI providers configurable via `.env`.

## Runtime OS Detection (Cross‑Platform)
The backend must detect OS at startup (`platform.system()`) and load appropriate modules:
- **macOS**: Use AppleScript for Calendar, Mail, Notes, Terminal, system actions.
- **Windows**: Use `win32com.client` (Outlook COM) for Calendar/Mail, OneNote or local notes for Notes, PowerShell/subprocess for terminal, `pyautogui` for typing/screenshots.

All other modules (memory, browser, work_mode, planner) are OS‑independent.

## Free AI Model Configuration – NVIDIA LLM + Free STT/TTS

Environment variables (`.env`):

```env
# ── NVIDIA LLM (free tier) ───────────────────────────
NVIDIA_API_KEY=your_free_key_from_build.nvidia.com
NVIDIA_MODEL=meta/llama-3.1-70b-instruct
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# ── Speech‑to‑Text (free) ───────────────────────────
STT_PROVIDER=groq               # or "whispercpp" (local)
GROQ_API_KEY=your_free_groq_key   # if using groq
WHISPERCPP_MODEL=tiny

# ── Text‑to‑Speech (free, OS native) ─────────────────
TTS_PROVIDER=auto               # macOS: say; Windows: SAPI
TTS_VOICE=                      # e.g., "Microsoft Hazel" on Windows, "Daniel" (British) on macOS

# ── User settings ────────────────────────────────────
USER_NAME=Sir
MARVIS_DATA_DIR=~/MARVIS        # expanded per OS

LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3 # or deepseek/deepseek-chat

- Implement `llm_client.py`:
- Class `OpenRouterLLM` using `openai` library with custom `base_url` and `api_key`.
- Method `generate(messages, stream=True)` → async generator of text chunks.

**STT (speech‑to‑text)** – Whisper (flexible):
- Prefer **Groq Whisper** (free tier, fast) → set `STT_PROVIDER=groq`, `GROQ_API_KEY`.
- Fallback: local `whisper.cpp` → `STT_PROVIDER=whispercpp`.
- Implement `stt_client.py` with factory that returns appropriate `transcribe(audio_bytes)` method.

**TTS (text‑to‑speech)** – entirely free, OS native:
- macOS: `subprocess.run(["say", text, "-v", "Daniel"])` (Daniel is British).
- Windows: `win32com.client.Dispatch("SAPI.SpVoice")` with voice `Microsoft Hazel` (British).
- Implement `tts_client.py` with OS detection: `platform.system() == "Darwin"` → `SayTTS`, `"Windows"` → `SAPITTS`.

## Cross‑platform system integrations (runtime detection)

Create these modules, each detecting OS and using appropriate backend:

### `calendar_access.py`
- macOS: AppleScript (`tell application "Calendar"`).
- Windows: Outlook COM (`win32com.client.Dispatch("Outlook.Application")`).
- Exports: `get_todays_events()`, `get_upcoming_events(hours)`.

### `mail_access.py`
- macOS: AppleScript (`tell application "Mail"`).
- Windows: Outlook COM.
- Exports: `get_unread_count()`, `get_recent_messages(n)`, `search_mail(query)`.

### `notes_access.py`
- macOS: AppleScript (`tell application "Notes"`).
- Windows: OneNote COM (if available) or fallback to local text files in `~/MARVIS/notes`.
- Exports: `get_recent_notes(n)`, `create_note(title, body)`.

### `actions.py`
- macOS: `subprocess.run(["open", ...])`, AppleScript for terminal.
- Windows: `subprocess.run(["start", ...])`, PowerShell, `pyautogui`.
- Exports: `open_app(name)`, `open_terminal(command)`, `take_screenshot()`, `type_text(text)`.

### OS‑independent modules
- `memory.py` – SQLite (tables for memories, tasks, notes with FTS5). Path: `os.path.expanduser("~/MARVIS/data/marvis.db")`.
- `browser.py` – Playwright (same on both).
- `work_mode.py`, `planner.py` – unchanged, using the dynamic LLM client.
- `server.py` – FastAPI + WebSocket endpoint `/ws`. Integrates all clients.

## Frontend (Vite + Three.js + TypeScript)
- `index.html` – full‑screen canvas, microphone button, subtitle display.
- `src/orb.ts` – particle system reacting to audio amplitude (use `getUserMedia` + AnalyserNode).
- `src/voice.ts` – record audio, send raw PCM chunks via WebSocket.
- `src/ws.ts` – WebSocket connection, send/receive JSON (`{type: "audio", data: base64}` and `{type: "text", content: "..."}`).
- `src/settings.ts` – simple UI for microphone selection, server URL.

## Directory structure (cross‑platform)

marvis/
├── data/ # SQLite database
├── frontend/
│ ├── src/
│ ├── index.html
│ ├── package.json
│ ├── tsconfig.json
│ └── vite.config.ts
├── scripts/
│ ├── start_mac.sh
│ └── start_windows.bat
├── .env.example
├── .gitignore
├── server.py
├── llm_client.py
├── stt_client.py
├── tts_client.py
├── memory.py
├── calendar_access.py
├── mail_access.py
├── notes_access.py
├── actions.py
├── browser.py
├── work_mode.py
├── planner.py
├── requirements.txt
└── README.md


## Environment variables (`.env`)

```env
# LLM – OpenRouter + DeepSeek V3
OPENROUTER_API_KEY=your_key_here
OPENROUTER_BASE_URL=https://openrouter.ai/api/v1
OPENROUTER_MODEL=deepseek/deepseek-chat-v3

# STT – Whisper via Groq (recommended) or local
STT_PROVIDER=groq
GROQ_API_KEY=your_groq_key
# WHISPERCPP_MODEL=tiny   # if using local

# TTS – auto picks OS native
# No extra keys required

# User
USER_NAME=Sir
MARVIS_DATA_DIR=~/MARVIS

fastapi uvicorn[standard] websockets python-dotenv
openai                      # for OpenRouter
groq                        # for Groq Whisper STT
pywin32                     # Windows COM (harmless on macOS)
pyautogui
playwright
sounddevice numpy
pypiwin32


---

Paste the above prompt into **DeepSeek V3** (via OpenRouter chat or API). It will output the entire codebase. Then follow the setup instructions – you'll have a voice assistant running on both Windows and macOS, using free whisper STT and native TTS.

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━  
**Final antigravity prompt delivered, sir.**  
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

the output of this project should the finest , make it in better way and full working end to end working model.