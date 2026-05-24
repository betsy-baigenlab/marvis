import os
import datetime
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from google.auth.transport.requests import Request
from googleapiclient.discovery import build

SCOPES = ['https://www.googleapis.com/auth/calendar']

def get_calendar_service():
    creds = None
    if os.path.exists('token.json'):
        creds = Credentials.from_authorized_user_file('token.json', SCOPES)
        
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            if not os.path.exists('credentials.json'):
                return None
            flow = InstalledAppFlow.from_client_secrets_file('credentials.json', SCOPES)
            creds = flow.run_local_server(port=0)
            
        with open('token.json', 'w') as token:
            token.write(creds.to_json())
            
    return build('calendar', 'v3', credentials=creds)

async def get_schedule() -> str:
    import asyncio
    loop = asyncio.get_running_loop()
    
    def fetch_events():
        service = get_calendar_service()
        if not service:
            return "To access your schedule, please set up Google Calendar by placing your credentials dot json file in my root directory."
            
        now = datetime.datetime.utcnow().isoformat() + 'Z'  # 'Z' indicates UTC time
        events_result = service.events().list(calendarId='primary', timeMin=now,
                                              maxResults=5, singleEvents=True,
                                              orderBy='startTime').execute()
        events = events_result.get('items', [])
        
        if not events:
            return "You have no upcoming events on your calendar."
            
        schedule = "Here is your upcoming schedule: "
        for event in events:
            start = event['start'].get('dateTime', event['start'].get('date'))
            # Format nicely
            try:
                # Handle Google's ISO formats
                dt = datetime.datetime.fromisoformat(start.replace('Z', '+00:00'))
                time_str = dt.strftime("%I:%M %p on %A")
            except:
                time_str = str(start)
                
            schedule += f"{event['summary']} at {time_str}. "
            
        return schedule

    try:
        return await loop.run_in_executor(None, fetch_events)
    except Exception as e:
        print(f"Calendar Error: {e}")
        return "I encountered an error trying to access your calendar."
