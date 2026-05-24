import os
import asyncio
from openai import AsyncOpenAI
from dotenv import load_dotenv

load_dotenv()

class OpenRouterLLM:
    def __init__(self):
        self.api_key = os.getenv("OPENROUTER_API_KEY", "")
        self.base_url = os.getenv("OPENROUTER_BASE_URL", "https://openrouter.ai/api/v1")
        self.model = os.getenv("OPENROUTER_MODEL", "deepseek/deepseek-chat")
        
        self.client = AsyncOpenAI(
            base_url=self.base_url,
            api_key=self.api_key
        )

    async def generate(self, messages, stream=True):
        """
        Generates a response from the LLM.
        Returns an async generator yielding text chunks.
        """
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=messages,
                stream=stream
            )
            
            if stream:
                async for chunk in response:
                    if chunk.choices[0].delta.content:
                        yield chunk.choices[0].delta.content
            else:
                yield response.choices[0].message.content
                
        except Exception as e:
            print(f"LLM Generation Error: {e}")
            yield f"Error generating response: {e}"

# Singleton instance
llm = OpenRouterLLM()
