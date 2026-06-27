from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.llm_client import llm_client

router = APIRouter(prefix="/api/v1", tags=["Log Summaries"])


class LogSummarizeRequest(BaseModel):
    content: str
    type: Optional[str] = "GENERAL"


class BatchSummarizeRequest(BaseModel):
    logs: list[LogSummarizeRequest]


SYSTEM_PROMPT = """You are an AI assistant for construction site daily logs. Your task is to create concise, informative summaries of construction site log entries.

RULES:
1. Summarize in 2-3 sentences maximum
2. Extract key information: work completed, crew size, weather conditions, notable events
3. Include any safety concerns or delays mentioned
4. Keep it factual - do not invent information not in the original log
5. Use professional construction terminology appropriately
6. Return ONLY the summary text, no additional commentary or formatting"""


@router.post("/logs/summarize")
async def summarize_log(request: LogSummarizeRequest):
    """Summarize a single daily log entry."""
    if not request.content:
        raise HTTPException(status_code=400, detail="Content is required")

    user_prompt = f"Summarize this {request.type} log entry:

{request.content}"

    try:
        summary = await llm_client.chat_completion(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_format="text",
        )
        # The client returns parsed JSON, but for text format we handle it differently
        if isinstance(summary, dict):
            summary = summary.get("summary", str(summary))
        return {"summary": summary}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")


@router.post("/logs/summarize-batch")
async def summarize_batch(request: BatchSummarizeRequest):
    """Summarize multiple daily log entries."""
    if not request.logs:
        raise HTTPException(status_code=400, detail="No logs provided")

    results = []
    for log in request.logs:
        user_prompt = f"Summarize this {log.type} log entry:

{log.content}"
        try:
            summary = await llm_client.chat_completion(
                system_prompt=SYSTEM_PROMPT,
                user_prompt=user_prompt,
                response_format="text",
            )
            if isinstance(summary, dict):
                summary = summary.get("summary", str(summary))
            results.append({"id": log.id if hasattr(log, 'id') else "", "summary": summary})
        except Exception:
            results.append({"id": "", "summary": "Failed to generate summary"})

    return {"summaries": results}