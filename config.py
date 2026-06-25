import os
from dotenv import load_dotenv

load_dotenv()

OPENROUTER_API_KEY: str = os.getenv("OPENROUTER_API_KEY", "")
if not OPENROUTER_API_KEY:
    raise EnvironmentError(
        "OPENROUTER_API_KEY is missing or empty. "
        "Please set it in your .env file before running Marvis."
    )

MIC_DEVICE: int = int(os.getenv("MIC_DEVICE", "1"))
WHISPER_MODEL: str = os.getenv("WHISPER_MODEL", "small")
WHISPER_DEVICE: str = os.getenv("WHISPER_DEVICE", "cpu")
WHISPER_COMPUTE: str = os.getenv("WHISPER_COMPUTE", "int8")
LLM_MODEL: str = os.getenv("LLM_MODEL", "deepseek/deepseek-chat")
LLM_URL: str = os.getenv("LLM_URL", "https://openrouter.ai/api/v1/chat/completions")
LLM_TEMPERATURE: float = float(os.getenv("LLM_TEMPERATURE", "0.5"))  # Lower for faster, more focused responses
LLM_MAX_TOKENS: int = int(os.getenv("LLM_MAX_TOKENS", "500"))  # Reduced for voice-friendly brevity and faster generation
LLM_TIMEOUT: int = int(os.getenv("LLM_TIMEOUT", "15"))  # Timeout in seconds for API calls

# Gmail IMAP (no OAuth2 needed — use a Gmail App Password)
GMAIL_EMAIL: str = os.getenv("GMAIL_EMAIL", "")
GMAIL_APP_PASSWORD: str = os.getenv("GMAIL_APP_PASSWORD", "")

# Timezone Configuration
TIMEZONE: str = os.getenv("TIMEZONE", "Asia/Kolkata")  # Default: India Standard Time (IST)
