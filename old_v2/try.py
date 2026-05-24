import sounddevice as sd

device_info = sd.query_devices(14, 'input')
print(device_info)