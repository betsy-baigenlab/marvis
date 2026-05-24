import os
import json
import urllib.request
from urllib.error import URLError
from dotenv import load_dotenv

load_dotenv()

async def get_top_news(query=None, limit=5):
    api_key = os.getenv("GNEWS_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return [{"title": "GNews API Key is missing. Please add GNEWS_API_KEY to your .env file.", "summary": ""}]
        
    if query:
        import urllib.parse
        # The GNews API rejects queries containing '&' with a 400 Bad Request
        safe_query = query.replace("&", " and ")
        encoded_query = urllib.parse.quote(safe_query)
        url = f"https://gnews.io/api/v4/search?q={encoded_query}&lang=en&max={limit}&apikey={api_key}"
    else:
        category = os.getenv("NEWS_CATEGORY", "world")
        url = f"https://gnews.io/api/v4/top-headlines?category={category}&lang=en&max={limit}&apikey={api_key}"
    
    try:
        import asyncio
        loop = asyncio.get_running_loop()
        
        def fetch_news():
            req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
            with urllib.request.urlopen(req) as response:
                return json.loads(response.read().decode('utf-8'))
                
        data = await loop.run_in_executor(None, fetch_news)
        
        articles = data.get("articles", [])
        if not articles:
            return [{"title": "No news found.", "summary": ""}]
            
        return [{"title": a.get("title", ""), "summary": a.get("description", "")[:200]} for a in articles]
    except Exception as e:
        print(f"Error fetching news: {e}")
        return [{"title": "Error fetching news.", "summary": str(e)}]
