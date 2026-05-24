"""
Jarvis Flask backend — FULLY LLM-DRIVEN architecture
Run: python server.py
Then open: http://localhost:5000
"""

from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import threading
import os
import datetime
import pytz
import re

from llm import ask_llm, get_current_time_info
from tts import speak
import memory
import gmail
from config import TIMEZONE

app = Flask(__name__, static_folder="ui", static_url_path="")
CORS(app)

WAKE_WORD = "jarvis"


def get_realtime_info() -> dict:
    """Get comprehensive real-time information in IST."""
    tz = pytz.timezone(TIMEZONE)
    now = datetime.datetime.now(tz)
    
    return {
        "timestamp": now.isoformat(),
        "time": now.strftime('%I:%M:%S %p'),
        "date": now.strftime('%A, %B %d, %Y'),
        "date_short": now.strftime('%d-%m-%Y'),
        "time_24h": now.strftime('%H:%M:%S'),
        "timezone": "IST (UTC+5:30)",
        "day_of_week": now.strftime('%A'),
        "unix_timestamp": int(now.timestamp()),
        "milliseconds": int(now.timestamp() * 1000)
    }


def get_realtime_timestamp() -> str:
    """Get real-time timestamp in IST."""
    return get_realtime_info()["timestamp"]


def strip_wake_word(text: str) -> str:
    """Remove wake word from command."""
    words = text.split()
    if WAKE_WORD in words:
        idx = words.index(WAKE_WORD)
        return " ".join(words[idx + 1:]).lstrip(", ").strip()
    return text


def process_llm_action(llm_response: str) -> tuple[str, str]:
    """
    Check if LLM response contains action tokens and execute them.
    Returns: (final_response, action_taken)
    
    Action tokens:
    - [ACTION:FETCH_EMAILS] - Fetch unread emails and return email data
    """
    # Check for fetch emails action
    if "[ACTION:FETCH_EMAILS]" in llm_response:
        print("[LLM ACTION] Fetching unread emails...")
        
        # Remove the action token from response
        response_without_action = llm_response.replace("[ACTION:FETCH_EMAILS]", "").strip()
        
        try:
            # Fetch emails
            emails_data = gmail.get_unread_emails()
            
            # Format email data for LLM to process
            email_context = f"""
USER'S UNREAD EMAILS:
{emails_data}

Now provide a natural summary of these emails for the user in a conversational way."""
            
            # Send email data back to LLM for final response generation
            print("[LLM] Processing email data...")
            final_response = ask_llm(email_context, memory=None)
            
            return final_response, "fetch_emails"
            
        except Exception as e:
            print(f"[ERROR] Failed to fetch emails: {e}")
            error_msg = f"I tried to fetch your emails but encountered an error: {e}. {response_without_action}"
            return error_msg, "fetch_emails_failed"
    
    # No action tokens found - return response as-is
    return llm_response, "none"


@app.route("/")
def index():
    return send_from_directory("ui", "index.html")


@app.route("/command", methods=["POST"])
def command():
    """
    FULLY LLM-DRIVEN command processing.
    All decisions are made by the LLM, no keyword-based logic.
    """
    data = request.get_json()
    raw = data.get("text", "").lower().strip()
    
    request_time_info = get_realtime_info()

    if not raw:
        return jsonify({
            "response": "", 
            "category": "none", 
            "timestamp": request_time_info["timestamp"],
            "processed_at": get_realtime_info()["timestamp"],
            "llm_driven": True
        })

    cmd = strip_wake_word(raw)
    if not cmd:
        return jsonify({
            "response": "", 
            "category": "none", 
            "timestamp": request_time_info["timestamp"],
            "processed_at": get_realtime_info()["timestamp"],
            "llm_driven": True
        })
    
    print(f"\n[{request_time_info['time']}] User Command: {cmd}")

    # System commands (clear memory, exit) - handled before LLM
    if any(x in cmd for x in ["clear memory", "forget everything"]):
        memory.clear()
        reply = "Memory cleared. I've forgotten our conversation history."
        threading.Thread(target=speak, args=(reply,), daemon=True).start()
        return jsonify({
            "response": reply,
            "category": "system",
            "timestamp": request_time_info["timestamp"],
            "processed_at": get_realtime_info()["timestamp"],
            "llm_driven": False,
            "action": "memory_clear"
        })

    if any(x in cmd for x in ["exit", "quit", "stop"]):
        reply = "Goodbye."
        threading.Thread(target=speak, args=(reply,), daemon=True).start()
        return jsonify({
            "response": reply,
            "category": "exit",
            "timestamp": request_time_info["timestamp"],
            "processed_at": get_realtime_info()["timestamp"],
            "llm_driven": False,
            "action": "exit"
        })

    # ============================================================
    # EVERYTHING ELSE GOES TO LLM (100% LLM-DRIVEN)
    # ============================================================
    
    print("[LLM] Processing command through DeepSeek V3...")
    
    # Get LLM response (LLM decides everything)
    llm_response = ask_llm(cmd, memory=memory.get_history())
    
    print(f"[LLM] Initial Response: {llm_response[:80]}...")
    
    # Check if LLM decided to take any actions
    final_response, action_taken = process_llm_action(llm_response)
    
    # Add to memory
    if final_response:
        memory.add_turn(cmd, final_response)
        threading.Thread(target=speak, args=(final_response,), daemon=True).start()
    
    processed_time = get_realtime_info()
    
    print(f"[{processed_time['time']}] Response: {final_response[:80]}...")
    print(f"[ACTION] {action_taken}\n")
    
    return jsonify({
        "response": final_response or "No response.",
        "category": "llm",
        "timestamp": request_time_info["timestamp"],
        "processed_at": processed_time["timestamp"],
        "time_info": request_time_info,
        "llm_driven": True,
        "action_taken": action_taken
    })


@app.route("/system-info", methods=["GET"])
def system_info():
    """Get comprehensive real-time system information."""
    info = get_realtime_info()
    
    return jsonify({
        "system": "Jarvis AI",
        "status": "running",
        "version": "3.0 (100% LLM-Driven)",
        "model": "DeepSeek V3 via OpenRouter",
        "architecture": "FULLY LLM-DRIVEN (No keyword-based logic)",
        "current_time_info": {
            "time": info["time"],
            "date": info["date"],
            "timezone": info["timezone"],
            "timestamp": info["timestamp"]
        },
        "memory": {
            "history_count": len(memory.get_history()) if memory.get_history() else 0,
            "status": "active"
        },
        "llm": {
            "model": "deepseek/deepseek-chat",
            "provider": "OpenRouter.ai",
            "real_time_context": "Enabled - Fresh time for every request",
            "autonomy_level": "FULL - LLM makes all decisions",
            "action_tokens_supported": ["[ACTION:FETCH_EMAILS]"]
        },
        "server": {
            "host": "0.0.0.0",
            "port": 5000,
            "timezone": TIMEZONE,
            "mode": "production",
            "request_processing": "100% LLM-driven with system prompt autonomy"
        },
        "features": {
            "fully_llm_driven": True,
            "no_keyword_routing": True,
            "real_time_updates": True,
            "voice_input": "Whisper (STT)",
            "voice_output": "pyttsx3 (TTS)",
            "email_integration": "Gmail (IMAP) - LLM decides when to fetch",
            "conversation_memory": True,
            "action_system": "LLM-driven action tokens for backend commands"
        }
    })


@app.route("/health")
def health():
    """Health check endpoint with real-time status."""
    info = get_realtime_info()
    return jsonify({
        "status": "healthy",
        "server_time": info["time"],
        "server_date": info["date"],
        "timezone": TIMEZONE,
        "timestamp": info["timestamp"],
        "real_time_enabled": True,
        "llm_driven": True
    })


@app.route("/memory/clear", methods=["POST"])
def clear_memory():
    """Clear conversation memory."""
    memory.clear()
    return jsonify({
        "status": "cleared",
        "message": "Conversation memory has been cleared",
        "timestamp": get_realtime_timestamp()
    })


@app.route("/time", methods=["GET"])
def get_time():
    """Get real-time current time in India (IST)."""
    info = get_realtime_info()
    return jsonify({
        "status": "real-time",
        "current_time": info["time"],
        "current_date": info["date"],
        "date_short": info["date_short"],
        "time_24h": info["time_24h"],
        "day_of_week": info["day_of_week"],
        "timezone": info["timezone"],
        "timestamp": info["timestamp"],
        "unix_timestamp": info["unix_timestamp"],
        "note": "Time is calculated fresh for every request"
    })


if __name__ == "__main__":
    startup_info = get_realtime_info()
    print("\n" + "=" * 80)
    print("[>>>] JARVIS AI - 100% LLM-DRIVEN ARCHITECTURE [<<<]")
    print("=" * 80)
    print(f"Server Time: {startup_info['time']} | Date: {startup_info['date']}")
    print(f"Timezone: {startup_info['timezone']}")
    print("=" * 80)
    print("\n[ARCHITECTURE] 100% LLM-DRIVEN:")
    print("   [+] NO keyword-based routing or logic")
    print("   [+] ALL requests processed by DeepSeek V3 LLM")
    print("   [+] LLM makes ALL decisions autonomously")
    print("   [+] Action tokens system: LLM instructs backend what to do")
    print("\n[FEATURES] Enabled:")
    print("   [+] Real-time updates (fresh time calculation per request)")
    print("   [+] DeepSeek V3 LLM with full autonomy")
    print("   [+] IST (India Standard Time) timezone")
    print("   [+] Voice input/output (STT/TTS)")
    print("   [+] Gmail integration (LLM decides when to fetch/compose)")
    print("   [+] Conversation memory with context")
    print("   [+] Action tokens: [ACTION:FETCH_EMAILS]")
    print("\n[LLM CAPABILITIES]:")
    print("   - Answer ANY question (knowledge, reasoning, etc.)")
    print("   - Provide real-time time/date using IST")
    print("   - Write/compose emails autonomously")
    print("   - Fetch and summarize unread emails")
    print("   - Open apps and guide on searches")
    print("   - Maintain conversation context")
    print("   - Make intelligent decisions about user intent")
    print("\n[API] Endpoints:")
    print("   GET  /time             -> Get real-time current time")
    print("   GET  /system-info      -> Get comprehensive system info")
    print("   GET  /health           -> Health check with real-time status")
    print("   POST /command          -> Send voice/text commands (100% LLM processed)")
    print("   POST /memory/clear     -> Clear conversation memory")
    print("\n[WEB] UI Access:")
    print("   http://localhost:5000")
    print("\n" + "=" * 80 + "\n")
    
    app.run(host="0.0.0.0", port=5000, debug=False)
