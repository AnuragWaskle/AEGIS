import os
import json
import asyncio
import httpx
import logging
import time
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")

class OllamaClient:
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url

    async def _make_request(self, payload: dict, is_json: bool = False) -> str | dict:
        url = f"{self.base_url}/api/chat"
        
        for attempt in range(3):
            try:
                start_time = time.time()
                input_length = len(json.dumps(payload))
                
                async with httpx.AsyncClient(timeout=30.0) as client:
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    data = response.json()
                    
                    response_time = time.time() - start_time
                    logger.info(f"Ollama call model={payload.get('model')} input_len={input_length} time={response_time:.2f}s attempt={attempt+1}")
                    
                    content = data.get("message", {}).get("content", "")
                    
                    if is_json:
                        try:
                            return json.loads(content)
                        except json.JSONDecodeError:
                            return {"error": "Failed to decode JSON response", "raw_content": content}
                    return content
                    
            except httpx.HTTPError as e:
                logger.error(f"HTTPError on attempt {attempt+1}: {str(e)}")
                if attempt == 2:
                    return {"error": str(e)} if is_json else str(e)
                await asyncio.sleep(2 ** attempt)
            except Exception as e:
                logger.error(f"Error on attempt {attempt+1}: {str(e)}")
                if attempt == 2:
                    return {"error": str(e)} if is_json else str(e)
                await asyncio.sleep(2 ** attempt)

    async def chat(self, model: str, messages: list, system: str = "") -> str:
        payload = {
            "model": model,
            "messages": messages,
            "stream": False
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]
            
        result = await self._make_request(payload, is_json=False)
        return str(result) if not isinstance(result, dict) else str(result.get('error', 'Unknown error'))

    async def chat_json(self, model: str, messages: list, system: str = "") -> dict:
        payload = {
            "model": model,
            "messages": messages,
            "format": "json",
            "stream": False
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]
            
        result = await self._make_request(payload, is_json=True)
        if isinstance(result, str):
            return {"error": result}
        return result

client = OllamaClient()
