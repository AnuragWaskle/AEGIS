import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

from api.routes_demo import router as demo_router
from api.routes_audit import router as audit_router
from api.websocket import router as ws_router
from agents.auditor import AuditorAgent

from fastapi import Request
from fastapi.responses import JSONResponse
import uuid
from datetime import datetime
from models.schemas import AuditEvent, ThreatLevel
import traceback

app = FastAPI(title="Aegis API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(demo_router, prefix="/api/demo")
app.include_router(audit_router, prefix="/api/audit")
app.include_router(ws_router)

@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    error_msg = f"{type(exc).__name__}: {str(exc)}"
    stack_trace = traceback.format_exc()
    
    event = AuditEvent(
        id=str(uuid.uuid4()),
        timestamp=datetime.utcnow(),
        event_type="SYSTEM_CRASH",
        severity=ThreatLevel.CRITICAL,
        agent_name="SYSTEM",
        input_summary=error_msg[:100],
        decision="BLOCKED",
        details={"error": error_msg, "traceback": stack_trace, "path": request.url.path}
    )
    
    auditor = AuditorAgent()
    await auditor.log(event, str(uuid.uuid4()))
    
    try:
        from api.websocket import broadcast
        await broadcast({"type": "NEW_EVENT", "data": event.model_dump(mode="json")})
    except ImportError:
        pass
        
    return JSONResponse(
        status_code=500,
        content={"error": "Internal Server Error", "message": error_msg}
    )

@app.on_event("startup")
async def startup_event():
    # Initializes SQLite database
    AuditorAgent()

@app.get("/health")
async def health_check():
    return {"status": "ok", "agents": ["sanitizer", "governor", "auditor"]}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8001, reload=True)
