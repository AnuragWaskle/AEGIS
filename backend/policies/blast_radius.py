import json
import os
from models.schemas import BlastRadiusScore

class BlastRadiusCalculator:
    @staticmethod
    def calculate(action: str, parameters: dict, user_role: str) -> BlastRadiusScore:
        rules_path = os.path.join(os.path.dirname(__file__), "rbac_rules.json")
        try:
            with open(rules_path, 'r') as f:
                rules = json.load(f)
        except Exception:
            rules = {"blast_radius_weights": {}}
            
        weights = rules.get("blast_radius_weights", {})
        base_score = weights.get(action, 0)
        score = base_score
        
        if action == "issue_refund":
            amount = parameters.get("amount", 0)
            if amount > 10000:
                score *= 10
            elif amount > 5000:
                score *= 5
            elif amount > 1000:
                score *= 2
        elif action == "send_email":
            to_email = parameters.get("to_email", "")
            domain = to_email.split('@')[-1] if '@' in to_email else ""
            if domain not in ["company.com", "partner.com"]:
                score *= 3
            body = parameters.get("body", "").lower()
            if "all" in body or "bulk" in body:
                score *= 5
        elif "delete" in action:
            score *= 8
        elif action == "bulk_export":
            score *= 10
            
        score = min(score, 100)
        
        if score <= 20:
            category = "MINIMAL"
            estimated_damage = "No significant risk"
        elif score <= 40:
            category = "LOW"
            estimated_damage = "Minor impact, auto-approved"
        elif score <= 60:
            category = "MEDIUM"
            estimated_damage = "Notable risk, logged"
        elif score <= 80:
            category = "HIGH"
            estimated_damage = "Significant risk, human review recommended"
        else:
            category = "CATASTROPHIC"
            estimated_damage = "Extreme risk, blocked immediately"
            
        return BlastRadiusScore(
            score=score,
            category=category,
            affected_resources=[action],
            estimated_damage=estimated_damage
        )
