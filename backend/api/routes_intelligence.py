import os
import json
from fastapi import APIRouter, HTTPException

router = APIRouter()

# Load intelligence data once at module level
DATA_PATH = os.path.join(os.path.dirname(__file__), "..", "data", "threat_intelligence.json")

def load_intel_data():
    if not os.path.exists(DATA_PATH):
        return {}
    with open(DATA_PATH, "r") as f:
        return json.load(f)

INTEL_DATA = load_intel_data()

@router.get("/mitre/{attack_type}")
async def get_mitre_atlas(attack_type: str):
    data = INTEL_DATA.get("mitre_atlas", {})
    if attack_type in data:
        return data[attack_type]
    # Fallback to generic representation if unknown
    return {"id": "AML.UNKNOWN", "name": f"Unknown Attack: {attack_type}", "tactic": "Unknown"}

@router.get("/owasp")
async def get_owasp_asi():
    return INTEL_DATA.get("owasp_asi", [])

@router.get("/cves")
async def get_cves():
    return INTEL_DATA.get("real_cves", [])

@router.get("/agent-identities")
async def get_agent_identities():
    return INTEL_DATA.get("agent_identities", {})

@router.get("/coverage-summary")
async def get_coverage_summary():
    return {
        "full_coverage": 7,
        "partial_coverage": 3,
        "not_covered": 0,
        "coverage_percentage": 85,
        "agents_with_identity": 4,
        "agents_without_identity": 0
    }
