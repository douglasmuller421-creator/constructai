from fastapi import APIRouter, HTTPException
from app.models.schemas import CostEstimateRequest, CostEstimateResponse
from app.services.estimation_service import estimation_service

router = APIRouter(prefix="/api/v1", tags=["AI Estimates"])


@router.post(
    "/estimates",
    response_model=CostEstimateResponse,
    summary="Generate AI Cost Estimate",
    description="Generate a detailed construction cost estimate using AI",
)
async def create_estimate(request: CostEstimateRequest):
    """Generate a cost estimate for a construction project."""
    try:
        result = await estimation_service.generate_estimate(request, save_to_db=True)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate estimate: {str(e)}",
        )


@router.post(
    "/estimates/preview",
    response_model=CostEstimateResponse,
    summary="Preview Estimate (no DB save)",
)
async def preview_estimate(request: CostEstimateRequest):
    """Generate a cost estimate without saving to database."""
    try:
        result = await estimation_service.generate_estimate(request, save_to_db=False)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to generate estimate: {str(e)}",
        )


@router.get("/health", summary="AI Service Health Check")
async def health_check():
    return {"status": "healthy", "service": "ai-cost-estimator"}