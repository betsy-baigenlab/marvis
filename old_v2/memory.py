"""
Conversation memory module for Jarvis.
Maintains a rolling in-memory window of the last 10 message turns (5 user + 5 assistant pairs).
"""

_history: list[dict] = []

MAX_TURNS = 10  # 5 user + 5 assistant pairs


def add_turn(user_text: str, assistant_text: str) -> None:
    """Append a user/assistant pair to history and trim to the last 10 entries."""
    _history.append({"role": "user", "content": user_text})
    _history.append({"role": "assistant", "content": assistant_text})
    # Keep only the last MAX_TURNS entries
    if len(_history) > MAX_TURNS:
        del _history[:len(_history) - MAX_TURNS]


def get_history() -> list:
    """Return a shallow copy of the conversation history."""
    return list(_history)


def clear() -> None:
    """Reset conversation history to empty."""
    global _history
    _history = []
