from fastapi import APIRouter
import os
import httpx
import time

router = APIRouter()

OLLAMA_BASE_URL = os.getenv("OLLAMA_BASE_URL", "http://localhost:11434")
GROQ_API_KEY = os.getenv("GROQ_API_KEY", "")

_start_time = time.time()


@router.get("/status")
async def get_agent_status():
    """
    Returns live status of all 3 agents.
    Pings Ollama to check if models are available.
    Falls back gracefully if Ollama is offline.
    """
    sanitizer_model = os.getenv("SANITIZER_MODEL", "phi3:mini")
    governor_model = os.getenv("GOVERNOR_MODEL", "mistral:7b")
    main_model = os.getenv("MAIN_AGENT_MODEL", "llama3.1:8b")

    ollama_online = False
    available_models = []
    ollama_latency_ms = None

    try:
        t0 = time.time()
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                ollama_online = True
                ollama_latency_ms = int((time.time() - t0) * 1000)
                models_data = resp.json().get("models", [])
                available_models = [m.get("name", "") for m in models_data]
    except Exception:
        ollama_online = False

    groq_active = bool(GROQ_API_KEY) and not ollama_online

    def model_status(model_name: str) -> dict:
        is_available = any(model_name in m for m in available_models)
        return {
            "model": model_name,
            "available": is_available or groq_active,
            "using_groq_fallback": groq_active and not is_available,
        }

    uptime_seconds = int(time.time() - _start_time)

    return {
        "agents": {
            "sanitizer": {
                "name": "SANITIZER",
                "status": "ONLINE",
                "description": "Input scanner — 3-layer detection (Regex + Fuzzy + LLM)",
                **model_status(sanitizer_model),
            },
            "governor": {
                "name": "GOVERNOR",
                "status": "ONLINE",
                "description": "Policy enforcer — RBAC + Blast Radius + Anomaly Detection",
                **model_status(governor_model),
            },
            "auditor": {
                "name": "AUDITOR",
                "status": "ONLINE",
                "description": "Forensic logger — Pure Python + SQLite",
                "model": "Python / SQLite",
                "available": True,
                "using_groq_fallback": False,
            },
        },
        "ollama": {
            "online": ollama_online,
            "base_url": OLLAMA_BASE_URL,
            "latency_ms": ollama_latency_ms,
            "available_models": available_models,
        },
        "groq": {
            "active": groq_active,
            "configured": bool(GROQ_API_KEY),
        },
        "uptime_seconds": uptime_seconds,
        "uptime_human": f"{uptime_seconds // 3600}h {(uptime_seconds % 3600) // 60}m",
    }
