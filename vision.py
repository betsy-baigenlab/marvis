import pyautogui
import base64
import io
import os
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

# We use a fast, highly-capable vision model available via OpenRouter
VISION_MODEL = "google/gemini-2.5-flash"

async def analyze_screen() -> str:
    # 1. Take a screenshot silently
    screenshot = pyautogui.screenshot()
    
    # 2. Convert to compressed base64 JPEG to save bandwidth
    img_byte_arr = io.BytesIO()
    screenshot.save(img_byte_arr, format='JPEG', quality=60)
    base64_image = base64.b64encode(img_byte_arr.getvalue()).decode('utf-8')
    
    # 3. Call OpenRouter
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key or api_key == "your_api_key_here":
        return "Your OpenRouter API Key is missing. I cannot analyze the screen."
        
    client = AsyncOpenAI(
        base_url="https://openrouter.ai/api/v1",
        api_key=api_key
    )
    
    prompt = "You are Jarvis. Describe what is currently visible on this computer screen. Keep it brief, conversational, and helpful. Do not use markdown."
    
    try:
        response = await client.chat.completions.create(
            model=VISION_MODEL,
            messages=[
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            max_tokens=150
        )
        
        # Clean up any residual markdown just in case
        content = response.choices[0].message.content
        return content.replace("*", "").replace("#", "").replace("`", "")
        
    except Exception as e:
        print(f"Vision API Error: {e}")
        return "I encountered an error while trying to analyze your screen."
