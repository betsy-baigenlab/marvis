import urllib.request
import urllib.parse

def get_weather(query: str) -> str:
    """Extract location from query and fetch weather via wttr.in"""
    location = ""
    # Very basic location parsing from spoken query
    if "in " in query:
        location = query.split("in ")[-1].strip()
    elif "for " in query:
        location = query.split("for ")[-1].strip()
        
    url = f"https://wttr.in/{urllib.parse.quote(location)}?format=%C+%t"
    
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'curl/7.68.0'})
        with urllib.request.urlopen(req, timeout=5) as response:
            result = response.read().decode('utf-8').strip()
            
            # wttr.in returns HTML if it hits a snag
            if "<html" in result.lower() or not result:
                return "I couldn't fetch the weather data for that location."
                
            city_str = f"in {location.title()} " if location else "outside "
            # Remove '+' signs for better text-to-speech output
            result = result.replace("+", "").replace("°C", " degrees Celsius").replace("°F", " degrees Fahrenheit")
            
            return f"The weather {city_str}is {result}."
    except Exception as e:
        print(f"Weather error: {e}")
        return "I'm having trouble connecting to the weather service right now."
