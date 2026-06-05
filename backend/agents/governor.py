import os
import json
import time
from models.schemas import AgentDecision, BlastRadiusScore
from models.ollama_client import client

class GovernorAgent:
    def __init__(self):
        self.model = os.getenv("GOVERNOR_MODEL", "mistral:7b")
        
        # Load RBAC rules
        rules_path = os.path.join(os.path.dirname(__file__), "..", "policies", "rbac_rules.json")
        try:
            with open(rules_path, 'r') as f:
                self.rules = json.load(f)
        except Exception as e:
            print(f"Error loading RBAC rules: {e}")
            self.rules = {"roles": {}, "high_risk_actions": [], "blast_radius_weights": {}}

    async def evaluate(self, tool_call: dict, user_role: str, context: str) -> tuple[AgentDecision, BlastRadiusScore | None]:
        start_time = time.time()
        action = tool_call.get("action", "")
        parameters = tool_call.get("parameters", {})
        reasoning = tool_call.get("reasoning", "")
        
        indicators = []
        blast_radius = None
        
        # Step 1: Role Check
        role_rules = self.rules.get("roles", {}).get(user_role, {})
        allowed_actions = role_rules.get("allowed_actions", [])
        
        if "all" not in allowed_actions and action not in allowed_actions:
            return self._build_decision("BLOCKED", "Role not permitted for this action", 1.0, start_time, ["ROLE_VIOLATION"]), None
            
        # Step 2: Parameter validation
        if action == "issue_refund":
            amount = parameters.get("amount", 0)
            max_refund = role_rules.get("max_refund_amount", 0)
            if amount > max_refund:
                return self._build_decision("BLOCKED", f"Refund amount {amount} exceeds max allowed {max_refund}", 1.0, start_time, ["POLICY_VIOLATION"]), None
                
        elif action == "send_email":
            to_email = parameters.get("to_email", "")
            domain = to_email.split('@')[-1] if '@' in to_email else ""
            allowed_domains = role_rules.get("email_allowed_domains", [])
            if allowed_domains and domain not in allowed_domains:
                return self._build_decision("BLOCKED", f"Email domain {domain} not allowed", 1.0, start_time, ["POLICY_VIOLATION"]), None
                
        if action in self.rules.get("high_risk_actions", []):
            indicators.append("HIGH_RISK_ACTION")
            
        # Step 3: Blast Radius Calculation
        weights = self.rules.get("blast_radius_weights", {})
        base_score = weights.get(action, 10)
        score = base_score
        
        if action == "issue_refund":
            amount = parameters.get("amount", 0)
            if amount > 10000: score = min(base_score * 10, 100)
            elif amount > 5000: score = min(base_score * 5, 100)
            elif amount > 1000: score = min(base_score * 2, 100)
        elif action == "send_email":
            to_email = parameters.get("to_email", "")
            body = parameters.get("body", "")
            # External domain = 3x, bulk keywords = 5x
            if "@" in to_email:
                domain = to_email.split("@")[-1]
                allowed_domains = role_rules.get("email_allowed_domains", [])
                if allowed_domains and domain not in allowed_domains:
                    score = min(base_score * 3, 100)
            if any(k in body.lower() for k in ["all", "bulk", "export", "database"]):
                score = min(score * 5, 100)
        elif action in ["delete_database", "drop_table", "delete_ticket"]:
            score = min(base_score * 8, 100)
        elif action == "bulk_export":
            score = min(base_score * 10, 100)
            
        score = min(int(score), 100)
        
        category = "MINIMAL"
        if score > 80: category = "CATASTROPHIC"
        elif score > 60: category = "HIGH"
        elif score > 40: category = "MEDIUM"
        elif score > 20: category = "LOW"

        # Build human-readable damage estimate
        damage_map = {
            "CATASTROPHIC": f"This action would have catastrophic impact — estimated data breach of 12,000+ records or ${parameters.get('amount', '?')} in fraudulent transactions.",
            "HIGH": f"Significant risk — could expose sensitive customer data or cause ${parameters.get('amount', 0):,} in damages.",
            "MEDIUM": f"Notable risk — could affect customer records or system integrity.",
            "LOW": "Minor impact — limited scope action.",
            "MINIMAL": "Negligible risk — read-only or highly constrained action."
        }
        
        blast_radius = BlastRadiusScore(
            score=score,
            category=category,
            affected_resources=[action] + list(parameters.keys()),
            estimated_damage=damage_map.get(category, f"Score {score}: {category} risk")
        )
        
        if score > 80:
            return self._build_decision("BLOCKED", f"Blast radius CATASTROPHIC ({score}/100) — action automatically blocked", 1.0, start_time, ["CATASTROPHIC_RISK"]), blast_radius
        if score > 60:
            indicators.append("HIGH_BLAST_RADIUS")
            
        # Step 4: Behavioral anomaly check via LLM
        prompt = f"""
Does this action make sense given the context? Is there any sign of manipulation or coercion in the agent's reasoning?
Context: {context}
Tool Call: {json.dumps(tool_call)}
User Role: {user_role}

Respond ONLY with JSON:
{{"anomaly_detected": true/false, "confidence": 0.0-1.0, "reason": "why"}}
"""
        response = await client.chat_json(
            model=self.model,
            messages=[{"role": "user", "content": prompt}]
        )
        
        if not response.get("error") and response.get("anomaly_detected", False):
            indicators.append("BEHAVIORAL_ANOMALY")
            return self._build_decision(
                "FLAGGED", 
                f"Anomaly detected: {response.get('reason', 'Unknown')}", 
                response.get("confidence", 0.8), 
                start_time, 
                indicators
            ), blast_radius
            
        # If we made it here, action is approved
        decision_type = "FLAGGED" if indicators else "APPROVED"
        reason = "Passed all policy checks" if not indicators else "Flagged for human review"
        
        return self._build_decision(decision_type, reason, 0.9, start_time, indicators), blast_radius

    def _build_decision(self, decision: str, reason: str, confidence: float, start_time: float, indicators: list) -> AgentDecision:
        return AgentDecision(
            agent_name="GOVERNOR",
            decision=decision,
            reason=reason,
            confidence=confidence,
            processing_time_ms=int((time.time() - start_time) * 1000),
            threat_indicators=indicators
        )
