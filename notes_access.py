import os
import platform
from datetime import datetime

NOTES_DIR = os.path.expanduser("~/MARVIS/notes")

def _is_mac():
    return platform.system() == "Darwin"

def _ensure_dir():
    if not os.path.exists(NOTES_DIR):
        os.makedirs(NOTES_DIR)

def get_recent_notes(n: int):
    if _is_mac():
        return _get_recent_notes_mac(n)
    else:
        return _get_recent_notes_win(n)

def create_note(title: str, body: str):
    if _is_mac():
        return _create_note_mac(title, body)
    else:
        return _create_note_win(title, body)

def _get_recent_notes_mac(n: int):
    import subprocess
    script = f'''
    tell application "Notes"
        set recentNotes to ""
        set theNotes to notes of default account
        set counter to 0
        repeat with n in theNotes
            if counter is equal to {n} then exit repeat
            set recentNotes to recentNotes & name of n & "\\n"
            set counter to counter + 1
        end repeat
        return recentNotes
    end tell
    '''
    try:
        res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
        return res.stdout.strip()
    except Exception as e:
        return f"Notes Error: {e}"

def _create_note_mac(title: str, body: str):
    import subprocess
    script = f'''
    tell application "Notes"
        tell account "On My Mac"
            make new note at folder "Notes" with properties {{name:"{title}", body:"{body}"}}
        end tell
    end tell
    '''
    try:
        subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
        return "Note created successfully."
    except Exception as e:
        return f"Notes Error: {e}"

def _get_recent_notes_win(n: int):
    # Fallback to local files for Windows
    _ensure_dir()
    try:
        files = sorted(os.listdir(NOTES_DIR), key=lambda x: os.path.getctime(os.path.join(NOTES_DIR, x)), reverse=True)
        recent = []
        for f in files[:n]:
            if f.endswith('.txt'):
                recent.append(f.replace('.txt', ''))
        return "\n".join(recent) if recent else "No recent notes."
    except Exception as e:
        return f"Local Notes Error: {e}"

def _create_note_win(title: str, body: str):
    # Fallback to local files for Windows
    _ensure_dir()
    try:
        safe_title = "".join([c for c in title if c.isalpha() or c.isdigit() or c==' ']).rstrip()
        filename = f"{safe_title}_{datetime.now().strftime('%Y%m%d%H%M')}.txt"
        with open(os.path.join(NOTES_DIR, filename), "w", encoding="utf-8") as f:
            f.write(f"{title}\n\n{body}")
        return "Note created successfully."
    except Exception as e:
        return f"Local Notes Error: {e}"
