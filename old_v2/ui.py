"""
Marvis AI Assistant — GUI
Dark-themed Tkinter UI with chat display, mic status, and voice output.
Run this instead of main.py for the GUI experience.
"""

import tkinter as tk
from tkinter import scrolledtext
import threading
import time
import sys

from stt import listen
from tts import speak
import tts as tts_module
from llm import ask_llm
from actions import execute
import memory
import gmail

# ── Colours & fonts ──────────────────────────────────────────────────────────
BG          = "#0d0d0d"
PANEL_BG    = "#111111"
ACCENT      = "#00e5ff"       # cyan
ACCENT2     = "#7c4dff"       # purple
USER_CLR    = "#e0e0e0"
BOT_CLR     = "#00e5ff"
STATUS_CLR  = "#444444"
FONT_CHAT   = ("Consolas", 11)
FONT_TITLE  = ("Consolas", 18, "bold")
FONT_STATUS = ("Consolas", 10)

WAKE_WORD       = "marvis"
ACTION_KEYWORDS = ["time", "date", "open", "search"]
GMAIL_KEYWORDS  = ["email", "inbox", "mail", "messages"]


def route(command: str) -> str:
    if any(kw in command for kw in ACTION_KEYWORDS):
        return "action"
    elif any(kw in command for kw in GMAIL_KEYWORDS):
        return "gmail"
    return "llm"


class MarvisUI:
    def __init__(self, root: tk.Tk):
        self.root = root
        self.root.title("MARVIS — Personal AI Assistant")
        self.root.configure(bg=BG)
        self.root.geometry("820x640")
        self.root.minsize(640, 480)

        self._build_ui()
        self._running = True

        # Start assistant loop in background thread
        self._thread = threading.Thread(target=self._assistant_loop, daemon=True)
        self._thread.start()

    # ── UI construction ───────────────────────────────────────────────────────

    def _build_ui(self):
        # Title bar
        title_frame = tk.Frame(self.root, bg=BG)
        title_frame.pack(fill="x", padx=20, pady=(18, 0))

        tk.Label(
            title_frame, text="◈ MARVIS", font=FONT_TITLE,
            fg=ACCENT, bg=BG
        ).pack(side="left")

        self.status_dot = tk.Label(
            title_frame, text="●", font=("Consolas", 14),
            fg="#333333", bg=BG
        )
        self.status_dot.pack(side="left", padx=(10, 0), pady=(4, 0))

        self.status_label = tk.Label(
            title_frame, text="Initialising...", font=FONT_STATUS,
            fg=STATUS_CLR, bg=BG
        )
        self.status_label.pack(side="left", padx=(6, 0), pady=(4, 0))

        # Divider
        tk.Frame(self.root, bg=ACCENT2, height=1).pack(fill="x", padx=20, pady=(10, 0))

        # Chat area
        self.chat = scrolledtext.ScrolledText(
            self.root, bg=PANEL_BG, fg=USER_CLR,
            font=FONT_CHAT, wrap="word",
            relief="flat", bd=0,
            state="disabled", cursor="arrow"
        )
        self.chat.pack(fill="both", expand=True, padx=20, pady=12)

        # Tag colours
        self.chat.tag_config("user",    foreground="#aaaaaa")
        self.chat.tag_config("marvis",  foreground=BOT_CLR)
        self.chat.tag_config("system",  foreground="#555555")
        self.chat.tag_config("error",   foreground="#ff5252")

        # Bottom input row
        bottom = tk.Frame(self.root, bg=BG)
        bottom.pack(fill="x", padx=20, pady=(0, 16))

        self.input_var = tk.StringVar()
        self.entry = tk.Entry(
            bottom, textvariable=self.input_var,
            bg="#1a1a1a", fg=USER_CLR, insertbackground=ACCENT,
            font=FONT_CHAT, relief="flat", bd=6
        )
        self.entry.pack(side="left", fill="x", expand=True, ipady=6)
        self.entry.bind("<Return>", self._on_type_send)

        self.send_btn = tk.Button(
            bottom, text="Send", font=FONT_STATUS,
            bg=ACCENT2, fg="white", relief="flat",
            activebackground="#5c35cc", activeforeground="white",
            padx=14, pady=6,
            command=self._on_type_send
        )
        self.send_btn.pack(side="left", padx=(8, 0))

        self.mic_btn = tk.Button(
            bottom, text="🎤", font=("Consolas", 13),
            bg="#1a1a1a", fg=ACCENT, relief="flat",
            activebackground="#222222",
            padx=10, pady=6,
            command=self._on_mic_click
        )
        self.mic_btn.pack(side="left", padx=(6, 0))

        # Divider above input
        tk.Frame(self.root, bg=ACCENT2, height=1).pack(
            fill="x", padx=20, pady=(0, 0), before=bottom
        )

    # ── Chat helpers ──────────────────────────────────────────────────────────

    def _append(self, who: str, text: str, tag: str = "marvis"):
        self.chat.configure(state="normal")
        self.chat.insert("end", f"{who}  ", tag)
        self.chat.insert("end", text + "\n\n", "user" if tag == "user" else tag)
        self.chat.configure(state="disabled")
        self.chat.see("end")

    def _set_status(self, text: str, colour: str = STATUS_CLR, dot: str = "#333333"):
        self.status_label.configure(text=text, fg=colour)
        self.status_dot.configure(fg=dot)

    # ── Response handler (text + voice) ──────────────────────────────────────

    def _respond(self, text: str, tag: str = "marvis"):
        """Print to chat AND speak — always both."""
        self._append("MARVIS »", text, tag)
        threading.Thread(target=speak, args=(text,), daemon=True).start()

    # ── Process a command ─────────────────────────────────────────────────────

    def _process(self, command: str):
        command = command.lower().strip()
        if not command:
            return

        # Strip wake word
        words = command.split()
        if WAKE_WORD in words:
            idx = words.index(WAKE_WORD)
            command = " ".join(words[idx + 1:]).lstrip(", ").strip()
        if not command:
            return

        self._append("YOU  »", command, "user")

        # Memory clear
        if any(x in command for x in ["clear memory", "forget everything"]):
            memory.clear()
            self._respond("Memory cleared. I've forgotten our conversation history.")
            return

        # Exit
        if any(x in command for x in ["exit", "quit", "stop"]):
            self._respond("Goodbye.")
            self.root.after(2000, self.root.destroy)
            return

        category = route(command)
        self._set_status("Thinking...", ACCENT, ACCENT)

        if category == "action":
            result = execute(command)
            if result:
                self._respond(result)
                self._set_status("Listening...", ACCENT, ACCENT)
                return
            category = "llm"

        if category == "gmail":
            self._set_status("Checking email...", ACCENT, ACCENT)
            result = gmail.get_unread_emails()
            self._respond(result)
            self._set_status("Listening...", ACCENT, ACCENT)
            return

        # LLM
        response = ask_llm(command, memory=memory.get_history())
        if response:
            memory.add_turn(command, response)
            self._respond(response)
        self._set_status("Listening...", ACCENT, ACCENT)

    # ── Typed input ───────────────────────────────────────────────────────────

    def _on_type_send(self, event=None):
        text = self.input_var.get().strip()
        if not text:
            return
        self.input_var.set("")
        threading.Thread(target=self._process, args=(text,), daemon=True).start()

    # ── Mic button (single listen) ────────────────────────────────────────────

    def _on_mic_click(self):
        def _listen_once():
            self._set_status("🎤 Listening...", ACCENT, ACCENT)
            text = listen()
            if text:
                self._process(text)
            else:
                self._set_status("No speech detected", "#ff5252", "#ff5252")
                time.sleep(1.5)
                self._set_status("Listening...", ACCENT, ACCENT)
        threading.Thread(target=_listen_once, daemon=True).start()

    # ── Continuous assistant loop ─────────────────────────────────────────────

    def _assistant_loop(self):
        # Greeting
        self._set_status("Starting...", ACCENT, ACCENT)
        self._respond("Hello, I am Marvis. How can I assist you?")
        time.sleep(0.5)

        while self._running:
            try:
                # Wait for TTS to finish
                while tts_module.is_speaking:
                    time.sleep(0.1)

                self._set_status("🎤 Listening...", ACCENT, ACCENT)
                text = listen()

                if not text:
                    continue

                self._set_status("Processing...", ACCENT2, ACCENT2)
                self._process(text)

            except Exception as e:
                self._append("SYS  »", f"Error: {e}", "error")


# ── Entry point ───────────────────────────────────────────────────────────────

def main():
    root = tk.Tk()
    app = MarvisUI(root)
    root.protocol("WM_DELETE_WINDOW", lambda: (setattr(app, "_running", False), root.destroy()))
    root.mainloop()


if __name__ == "__main__":
    main()
