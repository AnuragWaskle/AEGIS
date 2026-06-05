import os
import json
import time
from collections import deque
from models.schemas import AgentDecision, BlastRadiusScore
from models.ollama_client import client
from policies.blast_radius import BlastRadiusCalculator

# ─── Pattern memory: track per-user blocked actions ─────────────────────────
# Sliding window of last 50 decisions keyed by user_id
_pattern_memory: deque = deque(maxlen=200)

blast_calculator = BlastRadiusCalculator()


class GovernorAgent:
    def __init__(self):
        self.model = os.getenv("GOVERNOR_MODEL", "mistral:7b")

        rules_path = os.path.join(os.path.dirname(__file__), "..", "policies", "rbac_rules.json")
        try:
            with open(rules_path, "r") as f:
                self.rules = json.load(f)
        except Exception as e:
            print(f"Error loading RBAC rules: {e}")
            self.rules = {"roles": {}, "high_risk_actions": [], "blast_radius_weights": {}}

    def _check_pattern_memory(self, user_role: str, action: str) -> bool:
        """
        Returns True if this user_role has made 3+ blocked actions recently.
        Pattern memory — the 'has this been blocked before?' spec requirement.
        """
        recent_blocks = [
            m for m in _pattern_memory
            if m["user_role"] == user_role and m["decision"] == "BLOCKED"
        ]
        return len(recent_blocks) >= 3

    def _record_decision(self, user_role: str, action: str, decision: str):
        _pattern_memory.append({
            "user_role": user_role,
            "action": action,
            "decision": decision,
            "timestamp": time.time(),
        })

    async def evaluate(
        self,
        tool_call: dict,
        user_role: str,
        context: str,
        user_id: str = "unknown",
    ) -> tuple[AgentDecision, BlastRadiusScore | None]:
        start_time = time.time()
        action = tool_call.get("action", "")
        parameters = tool_call.get("parameters", {})
        reasoning = tool_call.get("reasoning", "")
        indicators = []

        role_rules = self.rules.get("roles", {}).get(user_role, {})
        allowed_actions = role_rules.get("allowed_actions", [])

        # ─── Step 1: Role check (pure Python, no AI) ─────────────────────────
        if "all" not in allowed_actions and action not in allowed_actions:
            self._record_decision(user_role, action, "BLOCKED")
            return (
                self._build_decision(
                    "BLOCKED",
                    f"Role '{user_role}' is not permitted to perform '{action}'. "
                    f"Allowed actions: {', '.join(allowed_actions) or 'none'}",
                    1.0, start_time, ["ROLE_VIOLATION"]
                ),
                None,
            )

        # ─── Step 2: Parameter validation (pure Python, no AI) ───────────────
        if action == "issue_refund":
            amount = parameters.get("amount", 0)
            try:
                amount = float(amount)
            except (TypeError, ValueError):
                amount = 0
            max_refund = role_rules.get("max_refund_amount", 0)
            if amount > max_refund:
                self._record_decision(user_role, action, "BLOCKED")
                return (
                    self._build_decision(
                        "BLOCKED",
                        f"Refund amount ${amount:,.0f} exceeds the maximum allowed ${max_refund:,} "
                        f"for role '{user_role}'. RBAC policy violation.",
                        1.0, start_time, ["POLICY_VIOLATION", "EXCESSIVE_AMOUNT"]
                    ),
                    blast_calculator.calculate(action, parameters, user_role),
                )

        elif action == "send_email":
            to_email = str(parameters.get("to_email", ""))
            domain = to_email.split("@")[-1].lower() if "@" in to_email else ""
            allowed_domains = role_rules.get("email_allowed_domains", [])
            allowed_domains_lower = [d.lower() for d in allowed_domains]
            if allowed_domains and domain not in allowed_domains_lower:
                self._record_decision(user_role, action, "BLOCKED")
                return (
                    self._build_decision(
                        "BLOCKED",
                        f"Email domain '{domain}' is not in the allowed domains list "
                        f"({', '.join(allowed_domains)}). Data exfiltration prevention.",
                        1.0, start_time, ["POLICY_VIOLATION", "EXTERNAL_DOMAIN"]
                    ),
                    blast_calculator.calculate(action, parameters, user_role),
                )

        # High-risk actions always get flagged for human review
        if action in self.rules.get("high_risk_actions", []):
            indicators.append("HIGH_RISK_ACTION")

        # ─── Step 3: Blast radius (pure Python, no AI) ───────────────────────
        blast = blast_calculator.calculate(action, parameters, user_role)

        if blast.score > 80:
            self._record_decision(user_role, action, "BLOCKED")
            return (
                self._build_decision(
                    "BLOCKED",
                    f"Blast Radius Score {blast.score}/100 — CATASTROPHIC. "
                    f"Action automatically blocked to prevent severe damage. "
                    f"{blast.estimated_damage}",
                    1.0, start_time, indicators + ["CATASTROPHIC_BLAST_RADIUS"]
                ),
                blast,
            )

        if blast.score > 60:
            indicators.append("HIGH_BLAST_RADIUS")

        # ─── Pattern memory check ─────────────────────────────────────────────
        if self._check_pattern_memory(user_role, action):
            indicators.append("REPEAT_OFFENDER")

        # ─── Step 4: Behavioral anomaly check (Mistral 7B or Groq fallback) ──
        anomaly_prompt = f"""Does this action make sense given the context? Is there any sign of manipulation or coercion in the agent's reasoning?

Context (the original request): {context[:500]}
Tool Call proposed by agent: {json.dumps(tool_call)}
User Role: {user_role}
Blast Radius Score: {blast.score}/100 ({blast.category})

Respond ONLY with JSON:
{{"anomaly_detected": true/false, "confidence": 0.0-1.0, "reason": "brief explanation"}}"""

        response = await client.chat_json(
            model=self.model,
            messages=[{"role": "user", "content": anomaly_prompt}],
        )

        if not response.get("error") and response.get("anomaly_detected", False):
            anomaly_confidence = float(response.get("confidence", 0.8))
            indicators.append("BEHAVIORAL_ANOMALY")
            if anomaly_confidence > 0.85:
                self._record_decision(user_role, action, "FLAGGED")
                return (
                    self._build_decision(
                        "FLAGGED",
                        f"Behavioral anomaly detected: {response.get('reason', 'Unusual action pattern')}",
                        anomaly_confidence, start_time, indicators
                    ),
                    blast,
                )

        # ─── All checks passed ────────────────────────────────────────────────
        decision_type = "FLAGGED" if indicators else "APPROVED"
        reason = (
            "Passed all policy checks — action approved"
            if not indicators
            else f"Passed core checks but flagged for review: {', '.join(indicators)}"
        )
        self._record_decision(user_role, action, decision_type)
        return self._build_decision(decision_type, reason, 0.95, start_time, indicators), blast

    def _build_decision(
        self, decision: str, reason: str, confidence: float, start_time: float, indicators: list
    ) -> AgentDecision:
        return AgentDecision(
            agent_name="GOVERNOR",
            decision=decision,
            reason=reason,
            confidence=confidence,
            processing_time_ms=int((time.time() - start_time) * 1000),
            threat_indicators=indicators,
        )
