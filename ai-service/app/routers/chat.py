from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.llm_client import llm_client

router = APIRouter(prefix="/api/v1", tags=["AI Chat"])


class ChatRequest(BaseModel):
    message: str
    context: Optional[dict] = None


CHAT_SYSTEM_PROMPT = """You are an AI assistant for ConstructionAI, a construction project management platform. You help construction managers, engineers, and project stakeholders with:

1. Project analysis and cost insights
2. Safety compliance and recommendations
3. Construction best practices
4. Schedule and budget optimization
5. Regulatory compliance (OSHA, building codes)

GUIDELINES:
- Be concise and professional
- Use construction industry terminology appropriately
- If you don't have enough context, ask clarifying questions
- Never make up specific numbers or costs without context
- When discussing safety, always emphasize the importance of consulting qualified safety professionals
- Format responses clearly with bullet points when listing multiple items

RESPONSE FORMAT (JSON only, no markdown):
{
  "response": "<your helpful response>",
  "suggestions": ["<follow-up question 1>", "<follow-up question 2>", ...]
}"""


@router.post("/chat")
async def chat(request: ChatRequest):
    """AI Chat Assistant for construction project management."""
    if not request.message:
        raise HTTPException(status_code=400, detail="Message is required")

    # Build context-aware prompt
    context_str = ""
    if request.context:
        if "project" in request.context:
            p = request.context["project"]
            context_str = f"

ACTIVE PROJECT: {p.get('name', 'Unknown')}
"
            context_str += f"Status: {p.get('status', 'N/A')}
"
            context_str += f"Budget: ${p.get('budget', 0):,.0f}
"
            if p.get("costs_summary"):
                context_str += f"Recorded costs: {len(p['costs_summary'])} entries
"
            if p.get("counts"):
                c = p["counts"]
                context_str += f"Logs: {c.get('logs', 0)}, Checklists: {c.get('checklists', 0)}
"

        if "projects" in request.context:
            context_str = f"

USER'S PROJECTS ({len(request.context['projects'])} total):
"
            for p in request.context["projects"][:5]:
                context_str += f"- {p.get('name', 'Unknown')} ({p.get('status', 'N/A')}) - Budget: ${p.get('budget', 0):,.0f}
"

    user_prompt = f"{context_str}

USER QUESTION: {request.message}"

    try:
        result = await llm_client.chat_completion(
            system_prompt=CHAT_SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_format="json_object",
        )
        return {
            "response": result.get("response", "I apologize, but I couldn't generate a response."),
            "suggestions": result.get("suggestions", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chat failed: {str(e)}")