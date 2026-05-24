import os
import io
import asyncio
from dotenv import load_dotenv

load_dotenv()

class BaseSTT:
    async def transcribe(self, audio_bytes: bytes) -> str:
        raise NotImplementedError

class GroqSTT(BaseSTT):
    def __init__(self):
        from groq import AsyncGroq
        
        self.api_key = os.getenv("GROQ_API_KEY", "")
        if not self.api_key or self.api_key == "your_groq_api_key_here":
            raise EnvironmentError(
                "GROQ_API_KEY is missing or empty. "
                "Please set it in your .env file before running Jarvis."
            )
            
        self.client = AsyncGroq(api_key=self.api_key)
        self.model = os.getenv("GROQ_MODEL", "whisper-large-v3")
        
    async def transcribe(self, audio_bytes: bytes) -> str:
        try:
            # Groq requires a named file-like object
            file_obj = ("audio.wav", audio_bytes)
            
            translation = await self.client.audio.transcriptions.create(
                file=file_obj,
                model=self.model,
                response_format="json"
            )
            return translation.text
        except Exception as e:
            print(f"Groq STT Error: {e}")
            return ""

class LocalWhisperSTT(BaseSTT):
    def __init__(self):
        from faster_whisper import WhisperModel
        print("Loading local Whisper model...")
        model_size = os.getenv("WHISPER_MODEL", "small")
        device = os.getenv("WHISPER_DEVICE", "cpu")
        compute_type = os.getenv("WHISPER_COMPUTE", "int8")
        
        self.model = WhisperModel(model_size, device=device, compute_type=compute_type)
        print(f"Local Whisper model '{model_size}' loaded successfully!")
        
    async def transcribe(self, audio_bytes: bytes) -> str:
        try:
            import tempfile
            import os
            import asyncio
            
            # Write bytes to a temporary file
            with tempfile.NamedTemporaryFile(suffix=".webm", delete=False) as tmp:
                tmp.write(audio_bytes)
                tmp_path = tmp.name
                
            loop = asyncio.get_running_loop()
            
            def run_transcription():
                segments, _ = self.model.transcribe(tmp_path, language="en")
                text = ""
                for seg in segments:
                    text += seg.text
                return text.strip()
                
            text = await loop.run_in_executor(None, run_transcription)
            
            # Clean up temp file
            try:
                os.remove(tmp_path)
            except:
                pass
                
            return text
        except Exception as e:
            print(f"Local Whisper STT Error: {e}")
            return ""

def get_stt_client() -> BaseSTT:
    provider = os.getenv("STT_PROVIDER", "local").lower()
    if provider == "groq":
        return GroqSTT()
    elif provider == "local":
        return LocalWhisperSTT()
    else:
        print(f"Unknown STT_PROVIDER {provider}, defaulting to local Whisper")
        return LocalWhisperSTT()

stt = get_stt_client()
