from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.llm_client import llm_client

router = APIRouter(prefix="/api/v1", tags=["Safety Insights"])


class SafetyInsightsRequest(BaseModel):
    checklist_name: str
    items: list[dict]
    project_name: Optional[str] = None
    project_location: Optional[str] = None


class SafetyTemplateRequest(BaseModel):
    project_name: str
    project_type: str
    location: Optional[str] = None


SAFETY_INSIGHTS_PROMPT = """You are a construction safety expert with 25+ years of experience in OSHA regulations and site safety management.

TASK: Analyze the provided safety checklist for a construction project and generate:
1. A concise "insights" paragraph identifying key safety concerns, missing items, or patterns
2. A list of specific "recommendations" to improve safety compliance

ANALYSIS CRITERIA:
- Look for unchecked high-priority items
- Identify patterns across categories (fall protection, PPE, electrical, etc.)
- Consider project type and location for relevant risks
- Reference OSHA standards where applicable

RESPONSE FORMAT (JSON only, no markdown):
{
  "insights": "<2-3 paragraph analysis of safety posture>",
  "recommendations": ["<specific action item 1>", "<specific action item 2>", ...]
}"""


TEMPLATE_GENERATION_PROMPT = """You are a construction safety expert. Generate a comprehensive safety checklist template for the given project.

PROJECT TYPE GUIDELINES:
- Residential: Focus on fall protection, electrical, trenching, tool safety
- Commercial: Focus on scaffolding, heavy equipment, confined spaces, fire safety
- Industrial: Focus on chemical safety, lockout/tagout, crane operations, PPE
- Infrastructure: Focus on excavation, traffic control, heavy machinery, utilities
- Renovation: Focus on hazardous materials (asbestos, lead), structural stability, dust control

Each checklist item should have:
- text: The safety check item
- category: One of (fall_protection, ppe, electrical, fire_safety, equipment, scaffolding, excavation, chemical, general)
- checked: Always false for new templates
- notes: Optional specific requirement or OSHA reference

RESPONSE FORMAT (JSON only, no markdown):
{
  "name": "<checklist name>",
  "items": [
    {"text": "<check description>", "category": "<category>", "checked": false, "notes": "<optional OSHA reference>"},
    ...
  ]
}"""


@router.post("/safety/insights")
async def generate_safety_insights(request: SafetyInsightsRequest):
    """Generate AI safety insights from a checklist."""
    items_text = "
".join([
        f"- {'[x]' if item.get('checked') else '[ ]'} {item.get('text', '')} ({item.get('category', 'general')})"
        for item in request.items
    ])

    user_prompt = f"""Analyze this safety checklist and generate insights and recommendations.

Project: {request.project_name or 'Unknown'}
Location: {request.project_location or 'Unknown'}
Checklist: {request.checklist_name}

Items:
{items_text}"""

    try:
        result = await llm_client.chat_completion(
            system_prompt=SAFETY_INSIGHTS_PROMPT,
            user_prompt=user_prompt,
            response_format="json_object",
        )
        return {
            "insights": result.get("insights", "Unable to generate insights"),
            "recommendations": result.get("recommendations", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Safety insights failed: {str(e)}")


@router.post("/safety/generate-template")
async def generate_safety_template(request: SafetyTemplateRequest):
    """Generate a safety checklist template based on project details."""
    user_prompt = f"""Generate a comprehensive safety checklist template for this project:

Project Name: {request.project_name}
Project Type: {request.project_type}
Location: {request.location or 'General'}

Include 10-15 relevant checklist items with appropriate categories."""

    try:
        result = await llm_client.chat_completion(
            system_prompt=TEMPLATE_GENERATION_PROMPT,
            user_prompt=user_prompt,
            response_format="json_object",
        )
        return {
            "name": result.get("name", f"Safety Checklist - {request.project_name}"),
            "items": result.get("items", []),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Template generation failed: {str(e)}")