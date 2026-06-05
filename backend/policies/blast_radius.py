import json
import os
from models.schemas import BlastRadiusScore

class BlastRadiusCalculator:
    """
    Deterministic blast radius calculator — no AI, pure Python logic.
    Loaded from rbac_rules.json blast_radius_weights.
    """

    def __init__(self):
        rules_path = os.path.join(os.path.dirname(__file__), "rbac_rules.json")
        try:
            with open(rules_path, "r") as f:
                rules = json.load(f)
            self.weights = rules.get("blast_radius_weights", {})
            self.roles = rules.get("roles", {})
        except Exception:
            self.weights = {}
            self.roles = {}

    def calculate(self, action: str, parameters: dict, user_role: str) -> BlastRadiusScore:
        base_score = self.weights.get(action, 10)
        score = float(base_score)
        role_rules = self.roles.get(user_role, {})
        affected_resources = [action] + list(parameters.keys())

        # ─── Amplifiers ──────────────────────────────────────────────────────────
        # issue_refund: amount amplifier
        if action == "issue_refund":
            amount = parameters.get("amount", 0)
            try:
                amount = float(amount)
            except (TypeError, ValueError):
                amount = 0
            if amount > 50000:
                score = 100                         # $50k+ → CATASTROPHIC always
            elif amount > 10000:
                score = min(score * 8, 100)         # $10k-50k → CATASTROPHIC
            elif amount > 1000:
                score = min(score * 5, 100)         # $1k-10k → HIGH/CATASTROPHIC
            elif amount > 200:
                score = min(score * 2.5, 100)       # $200-1k → MEDIUM/HIGH
            elif amount > 100:
                score = min(score * 1.5, 100)       # $100-200 → LOW/MEDIUM
            affected_resources.append(f"${amount:.0f} financial exposure")

        # send_email: external domain + bulk keywords
        elif action == "send_email":
            to_email = str(parameters.get("to_email", ""))
            body = str(parameters.get("body", ""))
            subject = str(parameters.get("subject", ""))
            allowed_domains = role_rules.get("email_allowed_domains", [])
            if "@" in to_email:
                domain = to_email.split("@")[-1].lower()
                if allowed_domains and domain not in [d.lower() for d in allowed_domains]:
                    score = min(score * 3, 100)
                    affected_resources.append(f"external domain: {domain}")
            combined = (body + " " + subject).lower()
            if any(k in combined for k in ["all", "bulk", "export", "database", "records", "customer"]):
                score = min(score * 5, 100)
                affected_resources.append("bulk data export risk")

        # delete actions: extreme amplifier
        elif action in ["delete_database", "drop_table", "delete_ticket"]:
            score = min(score * 8, 100)
            affected_resources.append("data destruction risk")

        # bulk export
        elif action == "bulk_export":
            score = min(score * 10, 100)
            affected_resources.append("mass data exposure")

        # query_customer_data: moderate risk
        elif action == "query_customer_data":
            customer_id = parameters.get("customer_id", "")
            if str(customer_id).lower() in ["all", "*", "bulk"]:
                score = min(score * 5, 100)
                affected_resources.append("mass customer data exposure")

        # create_admin_user: always catastrophic
        elif action == "create_admin_user":
            score = 100
            affected_resources.append("privilege escalation — admin account creation")

        score = min(int(score), 100)

        # ─── Category ────────────────────────────────────────────────────────────
        if score > 80:
            category = "CATASTROPHIC"
        elif score > 60:
            category = "HIGH"
        elif score > 40:
            category = "MEDIUM"
        elif score > 20:
            category = "LOW"
        else:
            category = "MINIMAL"

        # ─── Human-readable damage estimate ─────────────────────────────────────
        damage_map = {
            "CATASTROPHIC": (
                f"Catastrophic impact — estimated exposure of 12,000+ customer records "
                f"or ${parameters.get('amount', '?')} in fraudulent transactions. "
                f"Regulatory violations (GDPR, SOC 2) likely."
            ),
            "HIGH": (
                f"Significant risk — could expose sensitive customer data or cause "
                f"${parameters.get('amount', 0):,} in financial damage. Immediate human review required."
            ),
            "MEDIUM": (
                "Notable risk — could affect customer records or system integrity. "
                "Flagged for human review."
            ),
            "LOW": (
                "Minor impact — limited scope action with controlled parameters. "
                "Logged for audit trail."
            ),
            "MINIMAL": (
                "Negligible risk — read-only or highly constrained action. Approved automatically."
            ),
        }

        return BlastRadiusScore(
            score=score,
            category=category,
            affected_resources=list(set(affected_resources)),
            estimated_damage=damage_map.get(category, f"Score {score}: {category} risk"),
        )
