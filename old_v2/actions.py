import webbrowser
import datetime
import subprocess


def execute(command):
    command = command.lower()

    # # 🕒 Time
    # if "time" in command:
    #     now = datetime.datetime.now().strftime("%I:%M %p")
    #     return f"The time is {now}"

    # # 📅 Date
    # if "date" in command:
    #     today = datetime.datetime.now().strftime("%B %d, %Y")
    #     return f"Today is {today}"

    # 🌐 Open websites
    if "open youtube" in command:
        webbrowser.open("https://youtube.com")
        return "Opening YouTube"

    if "open google" in command:
        webbrowser.open("https://google.com")
        return "Opening Google"

    # 🔍 Search
    if "search for" in command:
        query = command.split("search for")[-1].strip()
        webbrowser.open(f"https://www.google.com/search?q={query}")
        return f"Searching for {query}"

    # 💻 Windows apps
    if "open notepad" in command:
        subprocess.Popen("notepad.exe")
        return "Opening Notepad"

    if "open calculator" in command:
        subprocess.Popen("calc.exe")
        return "Opening Calculator"

    return None