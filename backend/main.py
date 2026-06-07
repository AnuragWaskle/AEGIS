import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes_demo import router as demo_router
from api.routes_audit import router as audit_router
from api.routes_agent import router as agent_router
from api.routes_intelligence import router as intel_router
from api.websocket import router as ws_router
from agents.auditor import AuditorAgent

from fastapi import Request
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
from models.schemas import AuditEvent, ThreatLevel
import traceback

@asynccontextmanager
async def lifespan(app: FastAPI):
    AuditorAgent()  # Initializes SQLite database on startup
    yield

app = FastAPI(title="Aegis — Agentic Immune System API", version="2.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(demo_router, prefix="/api/demo")
app.include_router(audit_router, prefix="/api/audit")
app.include_router(agent_router, prefix="/api/agent")
app.include_router(intel_router, prefix="/api/intelligence")
app.include_router(ws_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"{type(exc).__name__}: {str(exc)}"
    stack_trace = traceback.format_exc()

    event = AuditEvent(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        event_type="SYSTEM_ERROR",
        severity=ThreatLevel.HIGH,
        agent_name="SYSTEM",
        input_summary=error_msg[:200],
        decision="FLAGGED",
        details={"error": error_msg, "traceback": stack_trace[:1000], "path": str(request.url.path)},
    )

    auditor = AuditorAgent()
    await auditor.log(event, str(uuid.uuid4()))

    try:
        from api.websocket import broadcast
        await broadcast({"type": "NEW_EVENT", "data": event.model_dump(mode="json")})
    except Exception:
        pass

    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": error_msg},
    )



@app.get("/health")
async def health_check():
    return {
        "status": "ok",
        "version": "2.0.0",
        "agents": ["sanitizer", "governor", "auditor"],
        "endpoints": ["/api/demo", "/api/audit", "/api/agent", "/ws"],
    }

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)

