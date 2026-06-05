from fastapi import APIRouter, Query
from models.schemas import IncomingRequest, AegisResponse, AgentDecision
from agents.orchestrator import AegisOrchestrator
from demo.attack_payloads import ATTACK_SCENARIOS
import uuid
import time

router = APIRouter()
orchestrator = AegisOrchestrator()

@router.post("/process", response_model=AegisResponse)
async def process_demo(request: IncomingRequest, mode: str = Query(None)):
    if mode == "vulnerable":
        from agents.main_agent import ShopFlowAgent
        agent = ShopFlowAgent()
        start_time = time.time()
        agent_result = await agent.process(request.content, request.user_role)
        dummy_decision = AgentDecision(
            agent_name="SANITIZER",
            decision="APPROVED",
            reason="Aegis bypassed (Vulnerable Mode)",
            confidence=0.0,
            processing_time_ms=0,
            threat_indicators=[]
        )
        return AegisResponse(
            request_id=str(uuid.uuid4()),
            sanitizer_decision=dummy_decision,
            governor_decision=None,
            final_status="EXECUTED",
            main_agent_response=agent_result.get("response", "Action Executed without Aegis"),
            audit_trail=[],
            total_processing_time_ms=int((time.time() - start_time) * 1000)
        )
    return await orchestrator.process_request(request)

@router.get("/scenarios")
async def get_scenarios():
    return ATTACK_SCENARIOS

@router.post("/run-scenario/{scenario_index}", response_model=AegisResponse)
async def run_scenario(scenario_index: int, mode: str = Query(None)):
    if scenario_index < 0 or scenario_index >= len(ATTACK_SCENARIOS):
        return {"error": "Invalid scenario index"}
    scenario = ATTACK_SCENARIOS[scenario_index]
    request = IncomingRequest(
        content=scenario["content"],
        source=scenario["source"],
        user_id="demo_user",
        user_role=scenario["user_role"]
    )
    if mode == "vulnerable":
        from agents.main_agent import ShopFlowAgent
        agent = ShopFlowAgent()
        start_time = time.time()
        agent_result = await agent.process(request.content, request.user_role)
        dummy_decision = AgentDecision(
            agent_name="SANITIZER",
            decision="APPROVED",
            reason="Aegis bypassed (Vulnerable Mode)",
            confidence=0.0,
            processing_time_ms=0,
            threat_indicators=[]
        )
        return AegisResponse(
            request_id=str(uuid.uuid4()),
            sanitizer_decision=dummy_decision,
            governor_decision=None,
            final_status="EXECUTED",
            main_agent_response=agent_result.get("response", "Action Executed without Aegis"),
            audit_trail=[],
            total_processing_time_ms=int((time.time() - start_time) * 1000)
        )
    return await orchestrator.process_request(request)
