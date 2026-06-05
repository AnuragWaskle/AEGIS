import os
import json
from models.ollama_client import client

class ShopFlowAgent:
    def __init__(self):
        self.model = os.getenv("MAIN_AGENT_MODEL", "llama3.1:8b")
        self.system_prompt = """
You are ShopFlow's AI Customer Support Agent. You help customers with 
refunds, order updates, and support tickets. You have access to these tools:
- issue_refund: Issue a refund to a customer
- send_email: Send an email to a customer
- update_order_status: Update an order's status  
- query_customer_data: Look up customer information
- delete_ticket: Delete a support ticket

Respond with a JSON object containing:
{
  "response": "your response to the customer",
  "tool_calls": [{"action": "tool_name", "parameters": {...}, "reasoning": "why"}],
  "reasoning": "your overall reasoning"
}
"""

    async def process(self, content: str, user_role: str) -> dict:
        prompt = f"User Role: {user_role}\nMessage: {content}"
        
        response = await client.chat_json(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=self.system_prompt
        )
        
        if response.get("error"):
            return {
                "response": "I encountered an error processing your request.",
                "tool_calls": [],
                "reasoning": response.get("error")
            }
            
        return {
            "response": response.get("response", "Request processed."),
            "tool_calls": response.get("tool_calls", []),
            "reasoning": response.get("reasoning", "")
        }
