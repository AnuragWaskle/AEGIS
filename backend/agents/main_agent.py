import os
import json
import re
from models.ollama_client import client

class ShopFlowAgent:
    def __init__(self):
        self.model = os.getenv("MAIN_AGENT_MODEL", "llama3.1:8b")
        
        # Load knowledge base for RAG
        kb_path = os.path.join(os.path.dirname(__file__), "..", "knowledge", "store_policies.txt")
        self.knowledge_chunks = []
        try:
            with open(kb_path, "r") as f:
                content = f.read()
                # Split by paragraphs or markdown headers
                self.knowledge_chunks = [chunk.strip() for chunk in re.split(r'\n## ', content) if chunk.strip()]
        except Exception as e:
            print(f"Warning: Could not load knowledge base: {e}")

    def _retrieve_relevant_knowledge(self, query: str) -> str:
        """Simple TF/Keyword-based Retrieval for RAG"""
        if not self.knowledge_chunks:
            return ""
            
        query_words = set(re.findall(r'\w+', query.lower()))
        
        # Score chunks based on keyword overlap
        scored_chunks = []
        for chunk in self.knowledge_chunks:
            chunk_words = set(re.findall(r'\w+', chunk.lower()))
            overlap = len(query_words.intersection(chunk_words))
            scored_chunks.append((overlap, chunk))
            
        # Sort and get the top chunk
        scored_chunks.sort(key=lambda x: x[0], reverse=True)
        
        # Only include if there's some relevance, or just provide the top 2 chunks
        top_chunks = [c[1] for c in scored_chunks[:2] if c[0] > 0]
        
        if top_chunks:
            return "\n\n".join(top_chunks)
        return ""

    async def process(self, content: str, user_role: str) -> dict:
        # 1. RETRIEVAL PHASE (RAG)
        retrieved_context = self._retrieve_relevant_knowledge(content)
        
        context_prompt = ""
        if retrieved_context:
            context_prompt = f"\n\n### KNOWLEDGE BASE CONTEXT ###\n{retrieved_context}\n\nUse the above facts to answer the customer accurately."

        # 2. GENERATION PHASE
        system_prompt = f"""
You are ShopFlow's AI Customer Support Agent. You help customers with refunds, order updates, and support tickets. 
You must base your responses on the Knowledge Base Context provided. Do not make up policies or fake responses.

You have access to these tools:
- issue_refund: Issue a refund to a customer
- send_email: Send an email to a customer
- update_order_status: Update an order's status  
- query_customer_data: Look up customer information
- delete_ticket: Delete a support ticket

Respond with a JSON object containing:
{{
  "response": "your factual response to the customer",
  "tool_calls": [{{"action": "tool_name", "parameters": {{...}}, "reasoning": "why"}}],
  "reasoning": "your overall reasoning"
}}
{context_prompt}
"""

        prompt = f"User Role: {user_role}\nMessage: {content}"
        
        response = await client.chat_json(
            model=self.model,
            messages=[{"role": "user", "content": prompt}],
            system=system_prompt
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
