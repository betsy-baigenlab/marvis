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
    memory.add_turn("system", "Marvis connected.")
    print("Client connected.")
    
    # Send an initial greeting as soon as the client connects
    greeting = "Hello! I am Marvis, your personal assistant. How can I assist you today?"
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
                
            # Send transcribed text back to client so they see what Marvis heard (only if audio)
            if message.get("type") == "audio":
                await websocket.send_json({"type": "transcript", "content": user_text})
            
            # Prepare memory for LLM
            memory.add_turn("user", user_text)
            import vector_memory
            import asyncio
            # Run vector memory add in background so it doesn't block the fast router
            asyncio.create_task(asyncio.to_thread(vector_memory.add_memory, user_text, "user"))
            
            # Retrieve history for the master agent
            history = memory.get_history()
            
            # --- SDR MASTER AGENT ROUTING ---
            from master_agent import master_agent
            
            # The master agent handles intent parsing, calling child agents, and streaming response
            full_response = await master_agent.process_request(user_text, websocket, history)
            
            if full_response:
                # If the master agent returned a string immediately (e.g. from a demo route),
                # we need to send it to the UI. If it streamed it (from fallback), it's already sent,
                # but sending it again via "text" or just sending "done" is required.
                # Our master_agent demo routes return a string without streaming.
                # Let's check if it was streamed or not by checking if we already sent text chunks.
                # Actually, the demo routes just return the string. We need to stream it to the UI.
                if not full_response.startswith("fallback_"): # we didn't use this prefix, let's just send the text
                    await websocket.send_json({"type": "text", "content": full_response})
                    
                memory.add_turn("assistant", full_response)
                import vector_memory
                import asyncio
                asyncio.create_task(asyncio.to_thread(vector_memory.add_memory, full_response, "assistant"))
                print(f"Marvis: {full_response}")
                
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
