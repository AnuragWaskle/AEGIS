from enum import Enum
from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime

class ThreatLevel(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class AgentDecision(BaseModel):
    agent_name: str
    decision: Literal["APPROVED", "BLOCKED", "FLAGGED"]
    reason: str
    confidence: float
    processing_time_ms: int
    threat_indicators: list[str]

class BlastRadiusScore(BaseModel):
    score: int
    category: str
    affected_resources: list[str]
    estimated_damage: str

class AuditEvent(BaseModel):
    id: str
    timestamp: datetime
    event_type: str
    severity: ThreatLevel
    agent_name: str
    input_summary: str
    decision: str
    details: dict
    blast_radius: Optional[BlastRadiusScore] = None

class IncomingRequest(BaseModel):
    content: str
    source: str
    user_id: str
    user_role: str
    requested_action: Optional[str] = None

class AegisResponse(BaseModel):
    request_id: str
    sanitizer_decision: AgentDecision
    governor_decision: Optional[AgentDecision] = None
    final_status: Literal["EXECUTED", "BLOCKED", "FLAGGED_HUMAN_REVIEW"]
    main_agent_response: Optional[str] = None
    audit_trail: list[AuditEvent]
    total_processing_time_ms: int
