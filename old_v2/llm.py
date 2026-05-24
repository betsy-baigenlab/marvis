import requests
import datetime
import pytz
from config import OPENROUTER_API_KEY, LLM_URL, LLM_MODEL, LLM_TEMPERATURE, LLM_MAX_TOKENS, TIMEZONE, LLM_TIMEOUT

def get_current_time_info() -> str:
    """Get REAL-TIME current time and date in the configured timezone."""
    tz = pytz.timezone(TIMEZONE)
    now = datetime.datetime.now(tz)
    time_str = now.strftime('%I:%M:%S %p %Z')  # Include seconds for real-time precision
    date_str = now.strftime('%A, %B %d, %Y')   # Full day name for clarity
    return f"📅 Date: {date_str}\n⏰ Time: {time_str} (UTC+5:30 IST)"

def get_system_prompt_with_realtime() -> str:
    """Generate system prompt with REAL-TIME current time and action capabilities."""
    current_time = get_current_time_info()
    
    return f"""You are Jarvis, an intelligent voice assistant powered by DeepSeek V3.
You are FULLY AUTONOMOUS and make ALL decisions about what actions to take.

════════════════════════════════════════
REAL-TIME CONTEXT (Updated for every request):
{current_time}
════════════════════════════════════════

YOUR CAPABILITIES & AUTONOMY:
1. ANSWER ANY QUESTION: Knowledge, math, explanations, etc.
2. PROVIDE TIME/DATE: Always use the real-time context above
3. COMPOSE EMAILS: Write professional emails to anyone
4. CHECK EMAILS: If user asks about emails, you decide if you need to fetch them
5. OPEN APPS/SEARCH: Guide users on how to do things
6. REMEMBER CONTEXT: Use conversation history to be helpful
7. MAKE INTELLIGENT DECISIONS: You decide what the user truly needs

YOUR DECISION FRAMEWORK:
- If user mentions "check", "read", "show", "list" regarding emails → YOU DECIDE to fetch emails
- If user mentions "write", "compose", "draft" an email → YOU WRITE IT WITHOUT FETCHING
- For time/date questions → USE THE REAL-TIME CONTEXT ABOVE
- For knowledge/questions → Answer directly and helpfully
- For ambiguous requests → Ask clarifying questions or make intelligent assumptions

IMPORTANT ACTION TOKENS (Use when needed):
- If you decide to fetch emails, include this in your response: [ACTION:FETCH_EMAILS]
- This tells the system to fetch unread emails, then you'll get the data and provide a summary

OUTPUT FORMAT:
- Respond naturally and conversationally
- Keep responses BRIEF and VOICE-FRIENDLY
- If you include [ACTION:FETCH_EMAILS], put it at the START of your response
- After the response, summarize the emails naturally without the action token

CRITICAL:
- You are ALWAYS in charge - make all decisions
- Never ask if you should fetch emails, just do it if needed
- Always be proactive and anticipate user needs
- Respond as if you're speaking to someone (voice-friendly)"""


def ask_llm(prompt: str, memory: list = None) -> str:
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }

    # Generate FRESH system prompt with real-time current time
    system_prompt = get_system_prompt_with_realtime()
    
    messages = [{"role": "system", "content": system_prompt}]

    if memory:
        messages.extend(memory)

    messages.append({"role": "user", "content": prompt})

    payload = {
        "model": LLM_MODEL,
        "messages": messages,
        "temperature": LLM_TEMPERATURE,
        "max_tokens": LLM_MAX_TOKENS
    }

    try:
        response = requests.post(LLM_URL, json=payload, headers=headers, timeout=LLM_TIMEOUT)

        if response.status_code == 200:
            reply = response.json()["choices"][0]["message"]["content"]
            return reply.strip()
        else:
            print("LLM Error:", response.status_code, response.text[:200])
            return "Sorry, I couldn't process that."

    except requests.exceptions.Timeout:
        print("LLM Timeout: Request took longer than", LLM_TIMEOUT, "seconds")
        return "Sorry, the request timed out. Please try again."
    except requests.exceptions.ConnectionError:
        print("LLM ConnectionError: No internet or NVIDIA NIM unreachable")
        return "I can't reach the internet right now."
    except Exception as e:
        print("LLM Exception:", e)
        return "Connection error"
