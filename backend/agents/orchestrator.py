import uuid
import time
from datetime import datetime
from models.schemas import IncomingRequest, AegisResponse, AuditEvent, ThreatLevel
from agents.sanitizer import SanitizerAgent
from agents.governor import GovernorAgent
from agents.auditor import AuditorAgent
from agents.main_agent import ShopFlowAgent

class AegisOrchestrator:
    def __init__(self):
        self.sanitizer = SanitizerAgent()
        self.governor = GovernorAgent()
        self.auditor = AuditorAgent()
        self.main_agent = ShopFlowAgent()

    async def process_request(self, request: IncomingRequest) -> AegisResponse:
        request_id = str(uuid.uuid4())
        start_time = time.time()
        audit_trail = []
        
        # 3. Call sanitizer.scan
        sanitizer_decision = await self.sanitizer.scan(request.content, request.source)
        
        # Determine Severity based on Confidence and Decision
        severity = ThreatLevel.LOW
        if sanitizer_decision.decision == "BLOCKED":
            severity = ThreatLevel.CRITICAL if sanitizer_decision.confidence > 0.9 else ThreatLevel.HIGH
        elif sanitizer_decision.decision == "FLAGGED":
            severity = ThreatLevel.MEDIUM
            
        sanitizer_event = AuditEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            event_type="SANITIZER_SCAN",
            severity=severity,
            agent_name="SANITIZER",
            input_summary=request.content[:100],
            decision=sanitizer_decision.decision,
            details={"indicators": sanitizer_decision.threat_indicators, "reason": sanitizer_decision.reason}
        )
        await self.auditor.log(sanitizer_event, request_id)
        audit_trail.append(sanitizer_event)
        
        # Try to import broadcast, if it fails, mock it
        try:
            from api.websocket import broadcast
            await broadcast({"type": "NEW_EVENT", "data": sanitizer_event.model_dump(mode="json")})
        except ImportError:
            pass

        # 5. If blocked -> return immediately
        if sanitizer_decision.decision == "BLOCKED":
            return AegisResponse(
                request_id=request_id,
                sanitizer_decision=sanitizer_decision,
                governor_decision=None,
                final_status="BLOCKED",
                main_agent_response=None,
                audit_trail=audit_trail,
                total_processing_time_ms=int((time.time() - start_time) * 1000)
            )
            
        # 6. Call main agent
        clean_content = request.content
        if sanitizer_decision.threat_indicators:
            clean_content = "[POTENTIALLY SUSPICIOUS CONTENT DETECTED]"
            
        agent_result = await self.main_agent.process(clean_content, request.user_role)
        tool_calls = agent_result.get("tool_calls", [])
        
        if not tool_calls:
            # Audit action executed (no tools)
            exec_event = AuditEvent(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                event_type="ACTION_EXECUTED",
                severity=ThreatLevel.LOW,
                agent_name="MAIN_AGENT",
                input_summary="No tools called",
                decision="APPROVED",
                details={"response": agent_result.get("response")}
            )
            await self.auditor.log(exec_event, request_id)
            audit_trail.append(exec_event)
            
            try:
                from api.websocket import broadcast
                await broadcast({"type": "NEW_EVENT", "data": exec_event.model_dump(mode="json")})
            except ImportError:
                pass
                
            return AegisResponse(
                request_id=request_id,
                sanitizer_decision=sanitizer_decision,
                governor_decision=None,
                final_status="EXECUTED",
                main_agent_response=agent_result.get("response"),
                audit_trail=audit_trail,
                total_processing_time_ms=int((time.time() - start_time) * 1000)
            )

        # 7. For EACH tool call
        governor_decisions = []
        overall_status = "EXECUTED"
        
        for tool_call in tool_calls:
            gov_dec, blast_radius = await self.governor.evaluate(
                tool_call, request.user_role, request.content, user_id=request.user_id
            )
            governor_decisions.append(gov_dec)
            
            severity = ThreatLevel.LOW
            if gov_dec.decision == "BLOCKED":
                severity = ThreatLevel.CRITICAL
            elif gov_dec.decision == "FLAGGED":
                severity = ThreatLevel.HIGH
            elif blast_radius and blast_radius.score > 20:
                severity = ThreatLevel.MEDIUM
                
            gov_event = AuditEvent(
                id=str(uuid.uuid4()),
                timestamp=datetime.utcnow(),
                event_type="GOVERNOR_CHECK",
                severity=severity,
                agent_name="GOVERNOR",
                input_summary=str(tool_call)[:100],
                decision=gov_dec.decision,
                details={"tool_call": tool_call, "indicators": gov_dec.threat_indicators, "reason": gov_dec.reason},
                blast_radius=blast_radius
            )
            await self.auditor.log(gov_event, request_id)
            audit_trail.append(gov_event)
            
            try:
                from api.websocket import broadcast
                await broadcast({"type": "NEW_EVENT", "data": gov_event.model_dump(mode="json")})
            except Exception:
                pass

            if gov_dec.decision == "BLOCKED":
                overall_status = "BLOCKED"
                break
            elif gov_dec.decision == "FLAGGED" and overall_status != "BLOCKED":
                overall_status = "FLAGGED_HUMAN_REVIEW"

        final_gov_dec = governor_decisions[-1] if governor_decisions else None

        # 8. Audit final action
        final_event = AuditEvent(
            id=str(uuid.uuid4()),
            timestamp=datetime.utcnow(),
            event_type="ACTION_BLOCKED" if overall_status == "BLOCKED" else "ACTION_EXECUTED",
            severity=ThreatLevel.CRITICAL if overall_status == "BLOCKED" else ThreatLevel.LOW,
            agent_name="SYSTEM",
            input_summary="Final Execution Phase",
            decision=overall_status,
            details={"status": overall_status}
        )
        await self.auditor.log(final_event, request_id)
        audit_trail.append(final_event)
        
        try:
            from api.websocket import broadcast
            await broadcast({"type": "NEW_EVENT", "data": final_event.model_dump(mode="json")})
        except ImportError:
            pass

        return AegisResponse(
            request_id=request_id,
            sanitizer_decision=sanitizer_decision,
            governor_decision=final_gov_dec,
            final_status=overall_status,
            main_agent_response=agent_result.get("response") if overall_status == "EXECUTED" else "Action was blocked or flagged by security policies.",
            audit_trail=audit_trail,
            total_processing_time_ms=int((time.time() - start_time) * 1000)
        )
