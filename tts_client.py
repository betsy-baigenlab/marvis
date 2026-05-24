import platform
import subprocess
import os

class BaseTTS:
    async def speak(self, text: str):
        raise NotImplementedError

class SayTTS(BaseTTS):
    def __init__(self):
        self.voice = os.getenv("TTS_VOICE", "Daniel")
        
    async def speak(self, text: str):
        try:
            # Running asynchronously using asyncio
            import asyncio
            process = await asyncio.create_subprocess_exec(
                "say", text, "-v", self.voice,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            await process.wait()
        except Exception as e:
            print(f"SayTTS Error: {e}")

class SAPITTS(BaseTTS):
    def __init__(self):
        self.voice_name = os.getenv("TTS_VOICE", "Microsoft Hazel Desktop")
        # Initialize COM only when needed in the thread to avoid COM apartment issues
        
    async def speak(self, text: str):
        try:
            import asyncio
            loop = asyncio.get_running_loop()
            await loop.run_in_executor(None, self._speak_sync, text)
        except Exception as e:
            print(f"SAPITTS Error: {e}")
            
    def _speak_sync(self, text: str):
        import pythoncom
        import win32com.client
        pythoncom.CoInitialize()
        try:
            engine = win32com.client.Dispatch("SAPI.SpVoice")
            # Try to set voice
            if self.voice_name:
                voices = engine.GetVoices()
                for voice in voices:
                    if self.voice_name.lower() in voice.GetDescription().lower():
                        engine.Voice = voice
                        break
            engine.Speak(text)
        finally:
            pythoncom.CoUninitialize()

def get_tts_client() -> BaseTTS:
    system = platform.system()
    if system == "Darwin":
        return SayTTS()
    elif system == "Windows":
        return SAPITTS()
    else:
        # Fallback for Linux or others, could use espeak
        print("Unsupported OS for TTS, using dummy TTS")
        return BaseTTS()

tts = get_tts_client()
