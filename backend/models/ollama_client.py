import os
import json
import asyncio
import httpx
import logging
import time
import re
from dotenv import load_dotenv

load_dotenv()

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")
GROQ_BASE_URL = "https://api.groq.com/openai/v1"

# Groq model fallbacks per role
GROQ_MODELS = {
    "phi3:mini": "llama-3.1-8b-instant",
    "mistral:7b": "mixtral-8x7b-32768",
    "llama3.1:8b": "llama-3.1-70b-versatile",
}


def _repair_json(raw: str) -> dict:
    """
    Attempt to extract a valid JSON object from a messy LLM response.
    Tries several strategies before giving up.
    """
    # Strategy 1: direct parse
    try:
        return json.loads(raw)
    except json.JSONDecodeError:
        pass

    # Strategy 2: find first {...} block
    match = re.search(r'\{.*\}', raw, re.DOTALL)
    if match:
        try:
            return json.loads(match.group(0))
        except json.JSONDecodeError:
            pass

    # Strategy 3: remove trailing commas, fix common issues
    try:
        cleaned = re.sub(r',\s*([}\]])', r'\1', raw)
        cleaned = re.sub(r'//.*?\n', '\n', cleaned)  # remove JS comments
        return json.loads(cleaned)
    except Exception:
        pass

    return {"error": "JSON parsing failed", "raw_content": raw[:200]}


class OllamaClient:
    def __init__(self, base_url: str = OLLAMA_BASE_URL):
        self.base_url = base_url

    async def _call_groq(self, model: str, messages: list, is_json: bool) -> str | dict:
        """Fallback to Groq API when Ollama is unavailable."""
        if not GROQ_API_KEY:
            return {"error": "No Groq API key set and Ollama unavailable"} if is_json else "Error: Ollama unavailable and no Groq fallback configured"

        groq_model = GROQ_MODELS.get(model, "llama-3.1-8b-instant")
        headers = {
            "Authorization": f"Bearer {GROQ_API_KEY}",
            "Content-Type": "application/json",
        }
        payload = {
            "model": groq_model,
            "messages": messages,
            "temperature": 0.1,
        }
        if is_json:
            payload["response_format"] = {"type": "json_object"}

        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                response = await client.post(
                    f"{GROQ_BASE_URL}/chat/completions",
                    headers=headers,
                    json=payload
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                logger.info(f"Groq fallback used: model={groq_model}")
                if is_json:
                    return _repair_json(content)
                return content
        except Exception as e:
            logger.error(f"Groq fallback also failed: {e}")
            if is_json:
                return {"error": str(e)}
            return f"Error: {e}"

    async def _make_request(self, payload: dict, is_json: bool = False) -> str | dict:
        url = f"{self.base_url}/api/chat"

        for attempt in range(3):
            try:
                start_time = time.time()
                input_length = len(json.dumps(payload))

                async with httpx.AsyncClient(timeout=60.0) as client:  # 60s for local models
                    response = await client.post(url, json=payload)
                    response.raise_for_status()
                    data = response.json()

                    elapsed = time.time() - start_time
                    logger.info(
                        f"Ollama: model={payload.get('model')} "
                        f"input_len={input_length} time={elapsed:.2f}s attempt={attempt+1}"
                    )

                    content = data.get("message", {}).get("content", "")

                    if is_json:
                        return _repair_json(content)
                    return content

            except httpx.ConnectError:
                # Ollama not running — go straight to Groq
                logger.warning(f"Ollama not reachable — switching to Groq fallback")
                return await self._call_groq(payload.get("model", ""), payload.get("messages", []), is_json)
            except httpx.HTTPError as e:
                logger.error(f"HTTPError attempt {attempt+1}: {e}")
                if attempt == 2:
                    logger.warning("All Ollama retries exhausted — trying Groq fallback")
                    return await self._call_groq(payload.get("model", ""), payload.get("messages", []), is_json)
                await asyncio.sleep(2 ** attempt)
            except Exception as e:
                logger.error(f"Error attempt {attempt+1}: {e}")
                if attempt == 2:
                    if is_json:
                        return {"error": str(e)}
                    return str(e)
                await asyncio.sleep(2 ** attempt)

        if is_json:
            return {"error": "All attempts failed"}
        return "Error: all attempts failed"

    async def chat(self, model: str, messages: list, system: str = "") -> str:
        payload = {
            "model": model,
            "messages": messages,
            "stream": False
        }
        if system:
            payload["messages"] = [{"role": "system", "content": system}] + payload["messages"]

        result = await self._make_request(payload, is_json=False)
        return str(result) if not isinstance(result, dict) else str(result.get("error", "Unknown error"))

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
