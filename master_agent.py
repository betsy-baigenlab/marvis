import asyncio
import json
import sdr_agents
from llm_client import llm

class SDRMasterAgent:
    def __init__(self):
        pass

    async def process_request(self, user_text: str, websocket, history) -> str:
        """
        Processes the user request, decides which child agents to invoke,
        and returns the combined output.
        """
        user_text_lower = user_text.lower()
        
        # DEMO ROUTING LOGIC
        # We use robust keyword matching to guarantee the demo flows perfectly.
        
        # 1. Goal Definition / Account Discovery / ICP
        # User: "Find M&A advisory firms interested in AI."
        if "find" in user_text_lower and ("m&a" in user_text_lower or "advisory" in user_text_lower or "ai" in user_text_lower):
            await websocket.send_json({"type": "status", "content": "Analyzing target market and industry data..."})
            result = await sdr_agents.run_research_and_icp(user_text)
            return result
            
        # 2. Show Prospects
        # User: "Show top prospects."
        elif "show" in user_text_lower and "prospects" in user_text_lower:
            await websocket.send_json({"type": "status", "content": "Retrieving qualified leads and details..."})
            result = await sdr_agents.get_top_prospects()
            return result
            
        # 3. Launch Campaign
        # User: "Launch campaign."
        elif "launch" in user_text_lower and "campaign" in user_text_lower:
            await websocket.send_json({"type": "status", "content": "Initiating sales sequence and campaigns..."})
            result = await sdr_agents.launch_campaign()
            return result
            
        # 4. Report
        # User: "Give me today's report."
        elif "report" in user_text_lower or "pipeline" in user_text_lower:
            await websocket.send_json({"type": "status", "content": "Compiling performance report and metrics..."})
            result = await sdr_agents.get_daily_report()
            return result
            
        # 5. Who should my sales team focus on this week?
        elif "focus" in user_text_lower or "sales team" in user_text_lower:
            await websocket.send_json({"type": "status", "content": "Analyzing high-intent accounts and buying indicators..."})
            result = await sdr_agents.get_sales_focus()
            return result
            
        # 6. Goal Acceptance
        elif "meetings" in user_text_lower and ("next 30 days" in user_text_lower or "20 meetings" in user_text_lower or "ai product" in user_text_lower or "goal" in user_text_lower) and "pipeline" not in user_text_lower:
            await websocket.send_json({"type": "status", "content": "Analyzing goal feasibility and allocating workforce..."})
            result = await sdr_agents.accept_goal_definition()
            return result
            
        # 7. Generate Pipeline Goal ($2M Pipeline)
        elif "pipeline" in user_text_lower and ("2m" in user_text_lower or "90 days" in user_text_lower or "north american" in user_text_lower):
            await websocket.send_json({"type": "status", "content": "Calculating strategy parameters and estimating workforce requirement..."})
            result = await sdr_agents.generate_pipeline_goal()
            return result
            
        # 8. Market Expansion
        elif "expand" in user_text_lower or "expansion" in user_text_lower or ("where should we" in user_text_lower and "next" in user_text_lower):
            await websocket.send_json({"type": "status", "content": "Analyzing global market opportunities, AI readiness, and regulations..."})
            result = await sdr_agents.market_expansion()
            return result
            
        # 9. Predictive buying probability within 30 days
        elif "likely to buy" in user_text_lower or "buying signals" in user_text_lower or ("prospects" in user_text_lower and "30 days" in user_text_lower):
            await websocket.send_json({"type": "status", "content": "Calculating account probability scores and buying signals..."})
            result = await sdr_agents.buying_prospects_predictive()
            return result
            
        # 10. Industry Demand
        elif "industries" in user_text_lower or "highest demand" in user_text_lower or "segments" in user_text_lower:
            await websocket.send_json({"type": "status", "content": "Analyzing segment workloads, labor costs, and AI adoption..."})
            result = await sdr_agents.industry_demand()
            return result
            
        # FALLBACK: Use LLM if it's not a demo script command
        else:
            await websocket.send_json({"type": "status", "content": "Marvis is thinking..."})
            
            system_prompt = """You are Marvis, the Master Agent for an AI-powered SDR workforce.
Your child agents are:
- Research Agent
- ICP Scoring Agent
- Contact Discovery Agent
- Enrichment Agent
- Outreach Agent
- Follow-up Agent
- Meeting Agent
- CRM Agent

Answer the user professionally and briefly, acting as the orchestrator of these agents. You act as the single interface for leadership teams."""
            
            messages = [{"role": "system", "content": system_prompt}]
            for msg in history:
                messages.append({"role": msg["role"], "content": msg["content"]})
            messages.append({"role": "user", "content": user_text})
            
            full_response = ""
            async for chunk in llm.generate(messages, stream=True):
                clean_chunk = chunk.replace("*", "").replace("#", "").replace("`", "")
                full_response += clean_chunk
                await websocket.send_json({"type": "text", "content": clean_chunk})
                
            return full_response

master_agent = SDRMasterAgent()
