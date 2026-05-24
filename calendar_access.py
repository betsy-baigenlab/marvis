import platform
import datetime

def _is_mac():
    return platform.system() == "Darwin"

def get_todays_events():
    if _is_mac():
        return _get_todays_events_mac()
    else:
        return _get_todays_events_win()

def get_upcoming_events(hours: int):
    if _is_mac():
        return _get_upcoming_events_mac(hours)
    else:
        return _get_upcoming_events_win(hours)

def _get_todays_events_mac():
    import subprocess
    script = '''
    tell application "Calendar"
        set todaysEvents to ""
        set today to current date
        set time of today to 0
        set tomorrow to today + (1 * days)
        repeat with c in calendars
            set theEvents to (every event of c whose start date is greater than or equal to today and start date is less than tomorrow)
            repeat with e in theEvents
                set todaysEvents to todaysEvents & summary of e & " at " & start date of e & "\n"
            end repeat
        end repeat
        return todaysEvents
    end tell
    '''
    try:
        res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
        return res.stdout.strip()
    except Exception as e:
        return f"Error accessing Calendar: {e}"

def _get_todays_events_win():
    try:
        import win32com.client
        outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
        calendar = outlook.GetDefaultFolder(9) # 9 is Calendar
        appointments = calendar.Items
        appointments.IncludeRecurrences = True
        appointments.Sort("[Start]")
        
        today = datetime.date.today()
        tomorrow = today + datetime.timedelta(days=1)
        
        appointments = appointments.Restrict(f"[Start] >= '{today.strftime('%m/%d/%Y')}' AND [Start] < '{tomorrow.strftime('%m/%d/%Y')}'")
        
        events = []
        for appt in appointments:
            events.append(f"{appt.Subject} at {appt.Start}")
        return "\n".join(events) if events else "No events today."
    except Exception as e:
        return f"Error accessing Outlook Calendar: {e}"

def _get_upcoming_events_mac(hours):
    # Simplified AppleScript for upcoming events
    return "Not implemented for macOS yet."

def _get_upcoming_events_win(hours):
    try:
        import win32com.client
        outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
        calendar = outlook.GetDefaultFolder(9)
        appointments = calendar.Items
        appointments.IncludeRecurrences = True
        appointments.Sort("[Start]")
        
        now = datetime.datetime.now()
        end_time = now + datetime.timedelta(hours=hours)
        
        appointments = appointments.Restrict(f"[Start] >= '{now.strftime('%m/%d/%Y %H:%M %p')}' AND [Start] <= '{end_time.strftime('%m/%d/%Y %H:%M %p')}'")
        
        events = []
        for appt in appointments:
            events.append(f"{appt.Subject} at {appt.Start}")
        return "\n".join(events) if events else f"No events in the next {hours} hours."
    except Exception as e:
        return f"Error accessing Outlook Calendar: {e}"
