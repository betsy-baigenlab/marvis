import webbrowser
import subprocess

def execute(command: str):
    command = command.lower()

    # 🌐 Open websites
    if "open youtube" in command:
        webbrowser.open("https://youtube.com")
        return "Opening YouTube."

    if "open google" in command:
        webbrowser.open("https://google.com")
        return "Opening Google."

    # 🔍 Search
    if "search for" in command:
        query = command.split("search for")[-1].strip()
        webbrowser.open(f"https://www.google.com/search?q={query}")
        return f"Searching Google for {query}."

    # 💻 Windows apps
    if "open notepad" in command:
        subprocess.Popen("notepad.exe")
        return "Opening Notepad."

    if "open calculator" in command:
        subprocess.Popen("calc.exe")
        return "Opening Calculator."
        
    if "open spotify" in command:
        # Spotify is usually registered in URI protocols
        subprocess.Popen("start spotify:", shell=True)
        return "Opening Spotify."
        
    if "open file explorer" in command or "open explorer" in command:
        subprocess.Popen("explorer.exe")
        return "Opening File Explorer."
        
    if "open task manager" in command:
        subprocess.Popen("taskmgr.exe")
        return "Opening Task Manager."

    # 🔊 System Media Controls
    if "volume up" in command:
        import pyautogui
        pyautogui.press(['volumeup', 'volumeup', 'volumeup', 'volumeup', 'volumeup'])
        return "Turning volume up."
        
    if "volume down" in command:
        import pyautogui
        pyautogui.press(['volumedown', 'volumedown', 'volumedown', 'volumedown', 'volumedown'])
        return "Turning volume down."
        
    if "mute volume" in command or "mute the volume" in command:
        import pyautogui
        pyautogui.press('volumemute')
        return "Muting system volume."
        
    # 🖥️ System Power & Tools
    if "take a screenshot" in command or "take screenshot" in command:
        import pyautogui
        from datetime import datetime
        import os
        filename = f"screenshot_{datetime.now().strftime('%Y%m%d_%H%M%S')}.png"
        filepath = os.path.join(os.path.expanduser("~"), "Pictures", filename)
        os.makedirs(os.path.dirname(filepath), exist_ok=True)
        pyautogui.screenshot(filepath)
        subprocess.Popen(f'explorer /select,"{filepath}"')
        return "Screenshot captured and saved to your Pictures folder."
        
    if "lock my pc" in command or "lock the screen" in command:
        import ctypes
        ctypes.windll.user32.LockWorkStation()
        return "Locking the workstation."

    return None