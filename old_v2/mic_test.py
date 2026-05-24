import sounddevice as sd
import numpy as np

DEVICE_INDEX = 14  # your mic

audio = sd.rec(16000 * 3, samplerate=16000, channels=2, device=DEVICE_INDEX)
sd.wait()

print("MAX:", np.max(audio))
print("MIN:", np.min(audio))