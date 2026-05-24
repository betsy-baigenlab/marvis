import asyncio
import websockets
import json

async def test_ws():
    uri = "ws://localhost:8000/ws"
    try:
        async with websockets.connect(uri) as websocket:
            print("Connected!")
            # Receive greeting
            greeting = await websocket.recv()
            print(f"< {greeting}")
            
            # Send message
            msg = {"type": "text", "content": "what is the time now"}
            print(f"> {msg}")
            await websocket.send(json.dumps(msg))
            
            # Wait for responses
            while True:
                response = await websocket.recv()
                print(f"< {response}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    asyncio.run(test_ws())
