# MARVIS AI - 100% LLM-DRIVEN ARCHITECTURE

## Overview
Marvis AI has been completely restructured to operate **EXCLUSIVELY through DeepSeek V3 LLM** with **ZERO keyword-based logic**. Every decision, every action, every response is now driven by the intelligent decision-making of the LLM.

---

## Architecture Changes

### BEFORE: Keyword-Based Routing
```
User Command
    ↓
Check keywords: email? time? exit?
    ↓ (Multiple branches)
├─ "email" → Gmail fetch
├─ "time" → Return time
├─ "exit" → Exit app
└─ Other → LLM

PROBLEM: Limited flexibility, hardcoded logic, multiple decision paths
```

### AFTER: 100% LLM-Driven
```
User Command
    ↓
DeepSeek V3 LLM (Autonomous Decision Maker)
    ↓ (Single decision point)
├─ LLM decides: "I need to fetch emails first"
│   └─ [ACTION:FETCH_EMAILS] → Server fetches
│       ↓
│   └─ LLM processes email data
│       ↓
│   └─ Returns intelligent response
│
├─ LLM decides: "Write an email"
│   └─ LLM composes autonomously
│       ↓
│   └─ Returns email draft
│
└─ LLM decides: "Answer the question"
    └─ Uses real-time context (time, date, etc.)
        ↓
    └─ Returns answer

ADVANTAGE: Fully autonomous, intelligent, flexible, no keyword limits
```

---

## Key Components

### 1. **System Prompt with Full Autonomy** (llm.py)
- LLM receives complete capability description
- Told it's in charge of ALL decisions
- Instructed when to use action tokens
- Has real-time context (time, date, timezone)

```python
SYSTEM_PROMPT = """
You are Marvis, FULLY AUTONOMOUS and make ALL decisions:
- Answer ANY question
- DECIDE if you need to fetch emails
- WRITE emails without asking
- PROVIDE real-time time/date
- Use [ACTION:FETCH_EMAILS] when needed
"""
```

### 2. **Action Token System** (server.py)
LLM can include special tokens in response to trigger backend actions:
- `[ACTION:FETCH_EMAILS]` → Server fetches unread emails
- Server executes action, returns data to LLM
- LLM generates final response with the data

Flow:
```
1. User: "Check my emails"
2. LLM: "[ACTION:FETCH_EMAILS] Let me fetch your emails..."
3. Server: Detects token, fetches emails
4. Server: Sends emails to LLM with context
5. LLM: "You have 3 emails. One from Sarah about..."
6. User receives intelligent summary
```

### 3. **No Keyword Routing** (server.py)
- REMOVED: `should_check_gmail()` function
- REMOVED: ACTION_KEYWORDS, GMAIL_KEYWORDS lists
- REMOVED: `route()` function
- REMOVED: All hardcoded decision logic
- ADDED: `process_llm_action()` function

Every request now follows:
```python
command() → ask_llm(cmd) → check_for_actions() → process_actions() → return_response()
```

### 4. **Real-Time Context** (llm.py + server.py)
- Current time injected fresh for EVERY request
- Timezone: IST (India Standard Time, UTC+5:30)
- LLM uses this context to answer time/date questions accurately
- Format: `Friday, April 24, 2026 | 10:58:10 PM IST`

---

## LLM Capabilities (Now Fully Autonomous)

| Capability | Before | After |
|---|---|---|
| Answer Questions | ✓ | ✓ (LLM decides everything) |
| Time/Date | Hard-coded | **LLM uses real-time context** |
| Email Check | Keywords only | **LLM decides & uses [ACTION]** |
| Email Compose | Not supported | **LLM writes autonomously** |
| Context Memory | ✓ | ✓ (Enhanced) |
| Intelligent Decisions | Limited | **FULL AUTONOMY** |

---

## API Endpoints (Unchanged in Function, Changed in Processing)

```
GET  /time
  → Returns real-time IST time
  → Calculated fresh per request

GET  /system-info
  → System status and capabilities
  → Shows "FULLY LLM-DRIVEN" in response

GET  /health
  → Health check with timestamp
  → Real-time status

POST /command
  → Main endpoint - 100% LLM PROCESSED
  → Returns: response, action_taken, timestamp

POST /memory/clear
  → Clear conversation memory
```

---

## Example Workflows

### Example 1: User asks "Write an email to my boss"
```
User: "Write an email to my boss asking for leave"
  ↓
Server: Sends to LLM (NO keyword check)
  ↓
LLM Response:
"Subject: Leave Request
Dear Boss,
I am writing to request leave...
[Completes email autonomously]"
  ↓
No [ACTION] token = No backend action needed
Response returned directly to UI
```

### Example 2: User asks "Check my emails"
```
User: "Check my emails"
  ↓
Server: Sends to LLM (NO keyword check)
  ↓
LLM Response:
"[ACTION:FETCH_EMAILS] Let me fetch your unread emails..."
  ↓
Server: Detects [ACTION:FETCH_EMAILS]
→ Fetches emails via Gmail IMAP
→ Sends email data back to LLM
  ↓
LLM: Processes emails, writes intelligent summary:
"You have 3 unread emails:
1. From Sarah - Project deadline moved to next week
2. From HR - Benefits enrollment is open
3. From Client - Approved your proposal"
  ↓
Response returned with action_taken: "fetch_emails"
```

### Example 3: User asks "What time is it?"
```
User: "What time is it?"
  ↓
Server: Sends to LLM with REAL-TIME CONTEXT
  ↓
LLM receives:
"[REAL-TIME CONTEXT: Friday, April 24, 2026 | 10:58:10 PM IST]"
  ↓
LLM Response:
"It's currently 10:58 PM IST on Friday, April 24, 2026.
[No ACTION token - responds directly]"
  ↓
Response returned immediately
```

---

## System Startup Output
```
================================================================================
[>>>] MARVIS AI - 100% LLM-DRIVEN ARCHITECTURE [<<<]
================================================================================
Server Time: 10:58:10 PM | Date: Friday, April 24, 2026
Timezone: IST (UTC+5:30)
================================================================================

[ARCHITECTURE] 100% LLM-DRIVEN:
   [+] NO keyword-based routing or logic
   [+] ALL requests processed by DeepSeek V3 LLM
   [+] LLM makes ALL decisions autonomously
   [+] Action tokens system: LLM instructs backend what to do

[FEATURES] Enabled:
   [+] Real-time updates (fresh time calculation per request)
   [+] DeepSeek V3 LLM with full autonomy
   [+] IST (India Standard Time) timezone
   [+] Voice input/output (STT/TTS)
   [+] Gmail integration (LLM decides when to fetch/compose)
   [+] Conversation memory with context
   [+] Action tokens: [ACTION:FETCH_EMAILS]
```

---

## Files Modified

| File | Changes |
|------|---------|
| **server.py** | Removed all keyword logic, added `process_llm_action()`, made 100% LLM-driven |
| **llm.py** | Enhanced system prompt with full autonomy, action token instructions |
| **config.py** | No changes (already has timezone support) |
| **gmail.py** | No changes (email integration remains same) |

---

## Key Improvements

1. **Flexibility**: LLM can handle ANY request type, not limited to keywords
2. **Intelligence**: LLM understands context and intent naturally
3. **Scalability**: Easy to add new capabilities - just instruct LLM in system prompt
4. **Autonomy**: No hardcoded rules, pure AI decision-making
5. **Natural Interaction**: Feels like talking to an intelligent assistant, not triggering commands
6. **Future-Proof**: New features don't require code changes, just prompt updates

---

## Testing

Server is running at:
- **Local**: http://localhost:5000
- **Network**: http://192.168.1.13:5000

Try in UI:
1. "What time is it?" → LLM uses real-time context
2. "Write an email to my boss" → LLM writes autonomously
3. "Check my emails" → LLM decides to fetch and summarizes
4. Any question → LLM handles it

---

## Summary

✅ **100% LLM-Driven**
✅ **Zero Keyword Logic**
✅ **Full Autonomy**
✅ **Real-Time Updates**
✅ **Action Token System**
✅ **Production Ready**

The Marvis AI system is now a **fully intelligent voice assistant** powered by **DeepSeek V3**, operating with complete autonomy and no hardcoded keyword matching.
