"""
TTS module for Marvis.
Spawns a fresh subprocess for each speak() call to avoid pyttsx3/sapi5
COM context issues when called from an imported module on Windows.
Every response is ALWAYS printed (text) AND spoken (voice).
"""

import subprocess
import sys

is_speaking = False


def speak(text):
    global is_speaking

    # 1. Always print
    print("MARVIS:", text)

    # 2. Always speak — via isolated subprocess to guarantee sapi5 works
    try:
        is_speaking = True

        script = (
            "import pyttsx3;"
            "e=pyttsx3.init('sapi5');"
            "e.setProperty('rate',170);"
            "e.setProperty('volume',1.0);"
            f"e.say({repr(text)});"
            "e.runAndWait()"
        )

        subprocess.run(
            [sys.executable, "-c", script],
            timeout=60
        )

    except subprocess.TimeoutExpired:
        print("❌ TTS timeout")
    except Exception as e:
        print("❌ TTS error:", e)
    finally:
        is_speaking = False
