import os
import json
import base64
import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from llm_client import llm
from stt_client import stt
from tts_client import tts
import memory

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    memory.add_turn("system", "Jarvis connected.")
    print("Client connected.")
    
    # Send an initial greeting as soon as the client connects
    greeting = "Hello! I am Jarvis, your personal assistant. How can I assist you today?"
    await websocket.send_json({"type": "text", "content": greeting})
    await websocket.send_json({"type": "done", "full_text": greeting})
    
    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            user_text = ""
            if message.get("type") == "audio":
                # Decode base64 audio
                audio_bytes = base64.b64decode(message["data"])
                print("Received audio, transcribing...")
                user_text = await stt.transcribe(audio_bytes)
                print(f"User (Audio): {user_text}")
            elif message.get("type") == "text":
                user_text = message["content"]
                print(f"User (Text): {user_text}")
                
            if not user_text.strip():
                continue
                
            # Send transcribed text back to client so they see what Jarvis heard (only if audio)
            if message.get("type") == "audio":
                await websocket.send_json({"type": "transcript", "content": user_text})
            
            # Prepare memory for LLM
            memory.add_turn("user", user_text)
            import vector_memory
            import asyncio
            # Run vector memory add in background so it doesn't block the fast router
            asyncio.create_task(asyncio.to_thread(vector_memory.add_memory, user_text, "user"))
            history = memory.get_history(limit=10)
            
            # Check for fast intents
            user_text_lower = user_text.lower()
            
            # --- FAST ROUTER (For maximum speed & responsiveness) ---
            user_text_lower = user_text.lower()
            
            # 1. Time / Date
            time_keywords = ["time", "date", "what day", "what time"]
            if any(kw in user_text_lower for kw in time_keywords):
                from datetime import datetime
                now = datetime.now()
                response = f"It is currently {now.strftime('%I:%M %p on %A, %B %d')}."
                await websocket.send_json({"type": "text", "content": response})
                memory.add_turn("assistant", response)
                await websocket.send_json({"type": "done", "full_text": response})
                continue
                
            # 1.2 Calendar
            calendar_keywords = ["what's on my schedule", "calendar", "my schedule", "what do i have today", "upcoming events"]
            if any(kw in user_text_lower for kw in calendar_keywords):
                await websocket.send_json({"type": "status", "content": "Jarvis is checking your calendar..."})
                import calendar_api
                calendar_result = await calendar_api.get_schedule()
                
                await websocket.send_json({"type": "text", "content": calendar_result})
                memory.add_turn("assistant", calendar_result)
                import vector_memory
                import asyncio
                asyncio.create_task(asyncio.to_thread(vector_memory.add_memory, calendar_result, "assistant"))
                await websocket.send_json({"type": "done", "full_text": calendar_result})
                continue
                
            # 1.3 Vision (Screen Awareness)
            vision_keywords = ["what am i looking at", "look at my screen", "read my screen", "what is on my screen", "summarize my screen"]
            if any(kw in user_text_lower for kw in vision_keywords):
                await websocket.send_json({"type": "status", "content": "Jarvis is analyzing your screen..."})
                import vision
                vision_result = await vision.analyze_screen()
                
                await websocket.send_json({"type": "text", "content": vision_result})
                memory.add_turn("assistant", vision_result)
                import vector_memory
                import asyncio
                asyncio.create_task(asyncio.to_thread(vector_memory.add_memory, vision_result, "assistant"))
                await websocket.send_json({"type": "done", "full_text": vision_result})
                continue
                
            # 1.5 Weather
            weather_keywords = ["weather", "temperature", "forecast", "how hot", "how cold"]
            if any(kw in user_text_lower for kw in weather_keywords):
                await websocket.send_json({"type": "status", "content": "Jarvis is checking the weather..."})
                import weather
                import asyncio
                weather_data = await asyncio.to_thread(weather.get_weather, user_text_lower)
                
                await websocket.send_json({"type": "text", "content": weather_data})
                memory.add_turn("assistant", weather_data)
                await websocket.send_json({"type": "done", "full_text": weather_data})
                continue
                
            # 2. News
            news_keywords = ["news", "headlines", "what's happening"]
            if any(kw in user_text_lower for kw in news_keywords):
                topic = None
                if "news about " in user_text_lower:
                    topic = user_text_lower.split("news about ")[1].strip()
                elif "news of " in user_text_lower:
                    topic = user_text_lower.split("news of ")[1].strip()
                elif "news on " in user_text_lower:
                    topic = user_text_lower.split("news on ")[1].strip()
                
                status_msg = f"Jarvis is fetching news about {topic}..." if topic else "Jarvis is fetching the news..."
                await websocket.send_json({"type": "status", "content": status_msg})
                import news
                news_items = await news.get_top_news(topic)
                full_response = f"Here are the top headlines{' about ' + topic if topic else ''}: "
                for i, item in enumerate(news_items):
                    full_response += f"Headline {i+1}: {item['title']}. "
                await websocket.send_json({"type": "text", "content": full_response})
                memory.add_turn("assistant", full_response)
                await websocket.send_json({"type": "done", "full_text": full_response})
                continue
                
            # 3. Actions (Open Web, Apps, Search)
            import actions
            action_result = actions.execute(user_text_lower)
            if action_result:
                await websocket.send_json({"type": "text", "content": action_result})
                memory.add_turn("assistant", action_result)
                await websocket.send_json({"type": "done", "full_text": action_result})
                continue
                
            # 4. Email
            gmail_keywords = ["email", "inbox", "mail", "messages"]
            if any(kw in user_text_lower for kw in gmail_keywords):
                await websocket.send_json({"type": "status", "content": "Jarvis is checking your inbox..."})
                import gmail
                import asyncio
                emails_data = await asyncio.to_thread(gmail.get_unread_emails)
                
                # Instantly send the raw summary to the UI for blazing fast speed
                await websocket.send_json({"type": "text", "content": emails_data})
                memory.add_turn("assistant", emails_data)
                await websocket.send_json({"type": "done", "full_text": emails_data})
                continue

            # --- 100% LLM-DRIVEN AUTONOMY (Fallback) ---
            from llm import get_system_prompt_with_realtime
            
            await websocket.send_json({"type": "status", "content": "Jarvis is thinking..."})
            
            # Retrieve long-term semantic context
            import vector_memory
            import asyncio
            past_context = await asyncio.to_thread(vector_memory.search_memory, user_text, 3)
            
            base_prompt = get_system_prompt_with_realtime()
            if past_context:
                base_prompt += "\n\nRELEVANT PAST MEMORIES (for context):\n" + "\n".join(past_context)
            
            messages = [
                {"role": "system", "content": base_prompt}
            ]
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
                
            messages.append({"role": "user", "content": user_text})
            
            print("Generating response...")
            full_response = ""
            
            async for chunk in llm.generate(messages, stream=True):
                clean_chunk = chunk.replace("*", "").replace("#", "").replace("`", "")
                full_response += clean_chunk
                await websocket.send_json({"type": "text", "content": clean_chunk})
                
            # Done generating
            memory.add_turn("assistant", full_response)
            import vector_memory
            import asyncio
            asyncio.create_task(asyncio.to_thread(vector_memory.add_memory, full_response, "assistant"))
            print(f"Jarvis: {full_response}")
            
            await websocket.send_json({"type": "done", "full_text": full_response})

    except WebSocketDisconnect:
        print("Client disconnected.")
    except Exception as e:
        import traceback
        with open("crash_log.txt", "w") as f:
            f.write(traceback.format_exc())
        print(f"WebSocket Error: {e}")

if __name__ == "__main__":
    uvicorn.run("server:app", host="0.0.0.0", port=8000, reload=True)
