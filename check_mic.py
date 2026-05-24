import sounddevice as sd

devices = sd.query_devices()

for i, d in enumerate(devices):
    print(i, d['name'])
    print("  Inputs:", d['max_input_channels'])
    print("  Default SR:", d['default_samplerate'])
    print()