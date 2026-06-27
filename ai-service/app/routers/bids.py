from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from app.services.llm_client import llm_client

router = APIRouter(prefix="/api/v1", tags=["AI Bid Analysis"])


class BidInput(BaseModel):
    subcontractor_name: str
    total_amount: Optional[float] = None
    programme_days: Optional[int] = None
    line_items: list[dict] = []
    exclusions: list[str] = []
    qualifications: list[str] = []

    subcontractor_rating: Optional[float] = None
    subcontractor_risk: Optional[str] = "MEDIUM"


class BidAnalysisRequest(BaseModel):
    package_name: str
    scope_of_work: Optional[str] = None
    estimated_value: Optional[float] = None
    contract_type: Optional[str] = "NEC4"
    bids: list[BidInput]


SYSTEM_PROMPT = """You are an expert construction quantity surveyor and procurement specialist with 25+ years of experience in bid analysis and tender evaluation.

Your task is to analyze multiple subcontractor bids for a construction project and provide:

1. **Scope Gaps**: Identify items that appear in the scope of work or in some bids but not others. These represent potential scope gaps that could lead to cost overruns or disputes.

2. **Pricing Anomalies**: Flag bids or line items that are abnormally high or low compared to the average. Use statistical analysis (values more than 2 standard deviations from the mean are anomalous).

3. **Recommendations**: Rank the bids by best value (not just lowest price). Consider:
   - Price competitiveness
   - Completeness of scope coverage
   - Subcontractor track record (rating)
   - Risk profile
   - Programme feasibility

4. **Risk Factors**: Identify risks associated with the bidding process or individual bids.

RESPONSE FORMAT (valid JSON only, no markdown):
{
  "lowest_amount": <number>,
  "highest_amount": <number>,
  "average_amount": <number>,
  "median_amount": <number>,
  "scope_gaps": [
    {
      "item": "<description>",
      "severity": "HIGH|MEDIUM|LOW",
      "covered_by": ["<subcontractor_name>", "..."],
      "not_covered_by": ["<subcontractor_name>", "..."],
      "recommendation": "<what to do>"
    }
  ],
  "pricing_anomalies": [
    {
      "subcontractor_name": "<name>",
      "item_description": "<description>",
      "their_rate": <number>,
      "average_rate": <number>,
      "deviation_percent": <number>,
      "flag": "ABNORMALLY_HIGH|ABNORMALLY_LOW",
      "explanation": "<why this is flagged>"
    }
  ],
  "recommendations": [
    {
      "rank": 1,
      "subcontractor_name": "<name>",
      "bid_id": "<id>",
      "type": "BEST_VALUE|LOWEST_PRICE|LOWEST_RISK|FASTEST",
      "score": <0-100>,
      "reasoning": "<why this recommendation>"
    }
  ],
  "risk_factors": [
    {
      "category": "<category>",
      "description": "<description>",
      "impact": "HIGH|MEDIUM|LOW",
      "mitigation": "<suggested action>"
    }
  ],
  "confidence_score": <0-1>,
  "executive_summary": "<2-3 paragraph summary of findings>"
}"""


@router.post("/bids/analyze")
async def analyze_bids(request: BidAnalysisRequest):
    """AI-powered bid leveling and comparison analysis."""
    if len(request.bids) < 2:
        raise HTTPException(status_code=400, detail="At least 2 bids required for comparison")

    # Build prompt
    bids_text = ""
    for i, bid in enumerate(request.bids, 1):
        bids_text += f"

BID {i}: {bid.subcontractor_name}
"
        bids_text += f"  Total: £{bid.total_amount:,.0f}
" if bid.total_amount else "  Total: Not provided
"
        bids_text += f"  Programme: {bid.programme_days} days
" if bid.programme_days else ""
        bids_text += f"  Rating: {bid.subcontractor_rating}/5
" if bid.subcontractor_rating else ""
        bids_text += f"  Risk: {bid.subcontractor_risk}
"
        if bid.line_items:
            bids_text += f"  Line items ({len(bid.line_items)}):
"
            for item in bid.line_items[:10]:
                rate = item.get("rate", 0)
                qty = item.get("quantity", 1)
                bids_text += f"    - {item.get('description', 'N/A')}: £{rate:,.2f} x {qty}
"
        if bid.exclusions:
            bids_text += f"  Exclusions: {', '.join(bid.exclusions)}
"

    user_prompt = f"""Analyze these bids for the following tender package:

Package: {request.package_name}
Scope: {request.scope_of_work or 'See individual bids'}
Estimated Value: £{request.estimated_value:,.0f}
Contract Type: {request.contract_type}

{bids_text}

Provide detailed bid leveling analysis with scope gap identification, pricing anomaly detection, and best-value recommendations."""

    try:
        result = await llm_client.chat_completion(
            system_prompt=SYSTEM_PROMPT,
            user_prompt=user_prompt,
            response_format="json_object",
        )
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Bid analysis failed: {str(e)}")


@router.get("/health", summary="AI Bid Analysis Health Check")
async def health_check():
    return {"status": "healthy", "service": "ai-bid-analysis"}