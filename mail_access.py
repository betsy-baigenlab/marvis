import platform

def _is_mac():
    return platform.system() == "Darwin"

def get_unread_count():
    if _is_mac():
        return _get_unread_count_mac()
    else:
        return _get_unread_count_win()

def get_recent_messages(n: int):
    if _is_mac():
        return _get_recent_messages_mac(n)
    else:
        return _get_recent_messages_win(n)

def search_mail(query: str):
    if _is_mac():
        return _search_mail_mac(query)
    else:
        return _search_mail_win(query)

def _get_unread_count_mac():
    import subprocess
    script = 'tell application "Mail" to return unread count of inbox'
    try:
        res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
        return int(res.stdout.strip())
    except Exception as e:
        print(f"Mail Error: {e}")
        return 0

def _get_recent_messages_mac(n: int):
    import subprocess
    script = f'''
    tell application "Mail"
        set recentMsgs to ""
        set theMessages to (messages of inbox whose read status is false)
        set counter to 0
        repeat with msg in theMessages
            if counter is equal to {n} then exit repeat
            set recentMsgs to recentMsgs & subject of msg & " from " & sender of msg & "\\n"
            set counter to counter + 1
        end repeat
        return recentMsgs
    end tell
    '''
    try:
        res = subprocess.run(["osascript", "-e", script], capture_output=True, text=True)
        return res.stdout.strip()
    except Exception as e:
        return f"Mail Error: {e}"

def _search_mail_mac(query: str):
    return "Search not implemented for macOS yet."

def _get_unread_count_win():
    try:
        import win32com.client
        outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
        inbox = outlook.GetDefaultFolder(6) # 6 is Inbox
        return inbox.UnReadItemCount
    except Exception as e:
        print(f"Outlook Error: {e}")
        return 0

def _get_recent_messages_win(n: int):
    try:
        import win32com.client
        outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
        inbox = outlook.GetDefaultFolder(6)
        messages = inbox.Items
        messages.Sort("[ReceivedTime]", True)
        
        recent = []
        for i, msg in enumerate(messages):
            if i >= n:
                break
            try:
                recent.append(f"Subject: {msg.Subject} | From: {msg.SenderName}")
            except:
                continue
        return "\n".join(recent)
    except Exception as e:
        return f"Outlook Error: {e}"

def _search_mail_win(query: str):
    try:
        import win32com.client
        outlook = win32com.client.Dispatch("Outlook.Application").GetNamespace("MAPI")
        inbox = outlook.GetDefaultFolder(6)
        messages = inbox.Items
        messages = messages.Restrict(f"@SQL=\"urn:schemas:httpmail:textdescription\" like '%{query}%' OR \"urn:schemas:httpmail:subject\" like '%{query}%'")
        
        results = []
        for i, msg in enumerate(messages):
            if i >= 5: # Limit to 5
                break
            try:
                results.append(f"Subject: {msg.Subject} | Date: {msg.ReceivedTime}")
            except:
                continue
        return "\n".join(results) if results else "No matches found."
    except Exception as e:
        return f"Outlook Error: {e}"
