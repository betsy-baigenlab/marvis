# Jarvis AI System Restructuring - DeepSeek V3 Integration

## Summary of Changes

The Jarvis AI system has been fully restructured to use **DeepSeek V3** as the primary LLM with end-to-end autonomous operation. All operations except email are now handled exclusively by the LLM, eliminating keyword-based routing for specific actions.

---

## File Changes

### 1. **config.py**
- Changed default LLM model from `openai/gpt-oss-20b:free` to `deepseek/deepseek-chat` (DeepSeek V3 via OpenRouter)
- Increased `LLM_MAX_TOKENS` from 1000 to 2000 for better responses

```python
LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek/deepseek-chat")
LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "2000"))
```

### 2. **llm.py**
- Enhanced system prompt to make the LLM fully autonomous:
  - Handles questions, time/date queries, opening apps, searching the web
  - Uses conversation memory context naturally
  - Provides concise, voice-friendly responses
  - Acts proactively to understand user intent

New system prompt emphasizes autonomy and comprehensive capability:
```python
SYSTEM_PROMPT = """You are Jarvis, an intelligent voice assistant powered by DeepSeek V3.
You are fully autonomous and capable of handling any user request intelligently:
- Answer questions on any topic
- Provide time, date, weather, and other information
- Execute system commands (open apps, search the web, etc.)
- Manage conversations naturally with memory context
- Be concise in your responses (suitable for voice output)
- Always be helpful and proactive in understanding user intent
"""
```

### 3. **gmail.py**
- Integrated LLM-based email summarization
- Uses DeepSeek V3 to intelligently summarize unread emails in a conversational way
- Provides natural, spoken-friendly email summaries
- Fallback mechanism if LLM summarization fails

Email summarization now:
- Formats email data (sender, subject, preview)
- Passes to LLM for intelligent summarization
- Returns conversational summary suitable for voice output
- Falls back to simple format if LLM is unavailable

### 4. **server.py**
- Removed keyword-based action routing (`ACTION_KEYWORDS`, `route()` function)
- Eliminated dependency on `actions.py`
- Simplified routing logic:
  - **Email commands** (keywords: "email", "inbox", "mail", "messages", "unread") → `gmail.get_unread_emails()` with LLM summarization
  - **Everything else** → DeepSeek V3 LLM for autonomous handling

New routing logic:
```python
# Check if it's an email-related command
if should_check_gmail(cmd):
    result = gmail.get_unread_emails()  # Uses LLM summarization internally
    return jsonify({"response": result, "category": "gmail"})

# Everything else: LLM handles it (time, date, open apps, search, Q&A, etc.)
response = ask_llm(cmd, memory=memory.get_history())
```

### 5. **requirements.txt**
- Added Flask dependencies (previously missing):
  - `flask>=2.3.0`
  - `flask-cors>=4.0.0`

---

## Behavioral Changes

### Before:
- Keyword-based routing split requests into "action", "gmail", and "llm" categories
- `actions.py` handled hardcoded specific tasks (time, date, open apps)
- Limited flexibility—requests not matching keywords fell back to LLM
- Email display was simple, non-intelligent summary

### After:
- **Single LLM decision point** for all non-email requests
- DeepSeek V3 handles:
  - Questions and general knowledge
  - Time and date queries
  - Opening applications
  - Web searches
  - Natural conversation with memory
  - Any user intent it can understand
- Email handling:
  - Still detected via keywords to pull unread emails
  - LLM provides intelligent, conversational summaries
  - Much more natural interaction

---

## How to Use

1. **Update `.env` file** (if not already set):
   ```
   OPENROUTER_API_KEY=your_api_key_here
   GMAIL_EMAIL=your_email@gmail.com
   GMAIL_APP_PASSWORD=your_app_password
   LLM_MODEL=deepseek/deepseek-chat  # Optional, defaults to this now
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Run the server**:
   ```bash
   python server.py
   ```

4. **Access the UI**:
   Open `http://localhost:5000` in your browser

---

## Example Interactions

### Time Query (LLM Autonomous)
- User: "What time is it?"
- LLM: "It's currently 3:45 PM."

### Email Summary (LLM-Enhanced)
- User: "Check my emails"
- LLM Summarizes: "You have 3 unread emails. Sarah sent you a project update about the Q2 roadmap. John's email is a meeting reschedule for tomorrow at 2 PM. And you have a promotion notification from your favorite store."

### General Question (LLM Autonomous)
- User: "What's the capital of France?"
- LLM: "Paris is the capital of France."

### Open Application (LLM Autonomous)
- User: "Open Google"
- LLM: "Opening Google for you."

---

## Notes

- `actions.py` is no longer used and can be removed if desired
- All requests (except memory/system commands) now go through DeepSeek V3
- Email detection still uses keywords for efficiency, but all email data is processed by LLM
- System is fully autonomous—no hardcoded action mappings
- Conversation memory is preserved and used by LLM for context-aware responses
