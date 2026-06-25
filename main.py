from stt import listen
from tts import speak, is_speaking
from llm import ask_llm
from actions import execute
import memory
import gmail
import time

WAKE_WORD = "marvis"

ACTION_KEYWORDS = ["time", "date", "open", "search"]
GMAIL_KEYWORDS = ["email", "inbox", "mail", "messages"]


def route(command: str) -> str:
    """Classify command into 'action', 'gmail', or 'llm'."""
    if any(kw in command for kw in ACTION_KEYWORDS):
        return "action"
    elif any(kw in command for kw in GMAIL_KEYWORDS):
        return "gmail"
    else:
        return "llm"


def main():
    speak("Hello, I am Marvis. How can I assist you?")

    while True:
        try:
            # Wait until Marvis finishes speaking
            while is_speaking:
                time.sleep(0.1)

            # Listen for input
            text = listen()
            if not text:
                continue

            text = text.lower().strip()
            print("📝 Raw input:", text)

            # Strip wake word if present (whole word match, strip trailing punctuation)
            if WAKE_WORD in text.split():
                idx = text.split().index(WAKE_WORD)
                command = " ".join(text.split()[idx + 1:]).lstrip(", ").strip()
            else:
                command = text

            if not command:
                continue

            print("📌 Command:", command)

            # Memory management commands
            if any(x in command for x in ["clear memory", "forget everything"]):
                memory.clear()
                try:
                    speak("Memory cleared. I've forgotten our conversation history.")
                except Exception as e:
                    print("❌ Speak error:", e)
                continue

            # Exit commands
            if any(x in command for x in ["exit", "quit", "stop"]):
                try:
                    speak("Goodbye")
                except Exception as e:
                    print("❌ Speak error:", e)
                break

            # Route the command
            category = route(command)

            if category == "action":
                result = execute(command)
                if result:
                    try:
                        speak(result)
                    except Exception as e:
                        print("❌ Speak error:", e)
                    continue
                # execute() returned None — fall through to LLM
                category = "llm"

            if category == "gmail":
                result = gmail.get_unread_emails()
                try:
                    speak(result)
                except Exception as e:
                    print("❌ Speak error:", e)
                continue

            # LLM path (category == "llm" or action fallback)
            response = ask_llm(command, memory=memory.get_history())
            if response:
                memory.add_turn(command, response)
                try:
                    speak(response)
                except Exception as e:
                    print("❌ Speak error:", e)

        except Exception as e:
            print("❌ Error:", e)


if __name__ == "__main__":
    main()
