import uuid
from typing import Any
from app.services.prompts import COST_ESTIMATOR_SYSTEM_PROMPT, build_estimate_prompt
from app.services.llm_client import llm_client
from app.models.schemas import (
    CostEstimateRequest,
    CostEstimateResponse,
    EstimateItem,
)


class EstimationService:
    """Service for generating and managing cost estimates."""

    async def generate_estimate(
        self, request: CostEstimateRequest, save_to_db: bool = True
    ) -> CostEstimateResponse:
        """Generate a cost estimate from the LLM."""

        # Build prompt
        request_data = request.model_dump()
        user_prompt = build_estimate_prompt(request_data)
        system_prompt = COST_ESTIMATOR_SYSTEM_PROMPT

        # Call LLM
        raw_estimate = await llm_client.chat_completion(
            system_prompt=system_prompt,
            user_prompt=user_prompt,
            response_format="json_object",
        )

        # Parse and validate response
        items = [
            EstimateItem(**item)
            for item in raw_estimate.get("items", [])
        ]

        # Build response
        estimate_id = str(uuid.uuid4()) if save_to_db else None

        response = CostEstimateResponse(
            estimate_id=estimate_id,
            project_name=request.project_name,
            project_type=request.project_type,
            location=request.location,
            total_estimated_cost=raw_estimate.get("total_estimated_cost", 0),
            cost_per_sqft=raw_estimate.get("cost_per_sqft", 0),
            items=items,
            confidence_score=raw_estimate.get("confidence_score", 0.5),
            cost_breakdown=raw_estimate.get("cost_breakdown", {}),
            timeline_estimate=raw_estimate.get("timeline_estimate"),
            risk_factors=raw_estimate.get("risk_factors", []),
            recommendations=raw_estimate.get("recommendations", []),
            saved_to_database=save_to_db and estimate_id is not None,
        )

        # Optionally save to database
        if save_to_db and estimate_id:
            await self._save_estimate(estimate_id, request, response)

        return response

    async def _save_estimate(
        self,
        estimate_id: str,
        request: CostEstimateRequest,
        response: CostEstimateResponse,
    ) -> None:
        """Save estimate to PostgreSQL via backend API."""
        import httpx

        backend_url = "http://localhost:4000"

        payload = {
            "estimate_id": estimate_id,
            "project_name": request.project_name,
            "project_type": request.project_type.value,
            "location": request.location,
            "square_footage": request.square_footage,
            "quality_level": request.quality_level.value,
            "total_estimated_cost": response.total_estimated_cost,
            "cost_per_sqft": response.cost_per_sqft,
            "confidence_score": response.confidence_score,
            "items": [item.model_dump() for item in response.items],
            "cost_breakdown": response.cost_breakdown,
            "timeline_estimate": response.timeline_estimate,
            "risk_factors": response.risk_factors,
            "recommendations": response.recommendations,
        }

        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                await client.post(
                    f"{backend_url}/api/v1/ai/estimates",
                    json=payload,
                )
        except Exception:
            # Don't fail the estimate if DB save fails
            pass


# Singleton
estimation_service = EstimationService()