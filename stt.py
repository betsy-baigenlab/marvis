import sounddevice as sd
import numpy as np
import webrtcvad
import re
import config
from faster_whisper import WhisperModel

# 🔥 VAD (voice detection)
vad = webrtcvad.Vad(2)

# 🔥 Whisper model
model = WhisperModel(config.WHISPER_MODEL, device=config.WHISPER_DEVICE, compute_type=config.WHISPER_COMPUTE)


def listen():
    print("🎤 Listening... (speak now)")

    samplerate = 16000
    duration = 5

    audio = sd.rec(
        int(duration * samplerate),
        samplerate=samplerate,
        channels=1,
        dtype='int16',
        device=config.MIC_DEVICE
    )

    sd.wait()
    audio = np.squeeze(audio)

    # 🔥 Voice activity detection
    frame_length = int(0.03 * samplerate)
    speech_frames = 0

    for i in range(0, len(audio), frame_length):
        frame = audio[i:i + frame_length]

        if len(frame) < frame_length:
            continue

        if vad.is_speech(frame.tobytes(), samplerate):
            speech_frames += 1

    # ❌ No speech → ignore
    if speech_frames < 5:
        print("⚠️ No speech detected")
        return ""

    # 🔥 Convert to float
    audio = audio.astype(np.float32) / 32768.0

    # 🔥 Force English
    segments, _ = model.transcribe(audio, language="en")

    text = ""
    for seg in segments:
        text += seg.text

    text = text.strip().lower()

    # 🔥 REMOVE NON-ENGLISH / GARBAGE
    if not re.search(r"[a-zA-Z]", text):
        print("⚠️ Ignored non-English / noise")
        return ""

    # 🔥 REMOVE VERY SHORT / USELESS TEXT
    if len(text) < 3:
        return ""

    print("🧠 You said:", text)
    return text