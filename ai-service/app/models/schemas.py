from pydantic import BaseModel, Field
from typing import Optional
from enum import Enum


class ProjectType(str, Enum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"
    INDUSTRIAL = "industrial"
    INFRASTRUCTURE = "infrastructure"
    RENOVATION = "renovation"


class BuildingSize(str, Enum):
    SMALL = "small"      # < 5,000 sq ft
    MEDIUM = "medium"    # 5,000 - 20,000 sq ft
    LARGE = "large"      # 20,000 - 100,000 sq ft
    XLARGE = "xlarge"    # > 100,000 sq ft


class QualityLevel(str, Enum):
    BASIC = "basic"
    STANDARD = "standard"
    PREMIUM = "premium"
    LUXURY = "luxury"


class EstimateItem(BaseModel):
    category: str = Field(..., description="Cost category (materials, labor, equipment, etc.)")
    description: str = Field(..., description="Item description")
    estimated_cost: float = Field(..., description="Estimated cost in USD")
    unit: Optional[str] = Field(None, description="Unit of measure (sq ft, hours, etc.)")
    quantity: Optional[float] = Field(None, description="Quantity")
    confidence: float = Field(..., ge=0, le=1, description="Confidence score 0-1")
    notes: Optional[str] = Field(None, description="Notes about the estimate")


class CostEstimateRequest(BaseModel):
    project_name: str = Field(..., min_length=2, max_length=200)
    project_type: ProjectType
    building_size: BuildingSize
    square_footage: float = Field(..., gt=0, description="Total square footage")
    location: str = Field(..., min_length=2, description="City, State or region")
    quality_level: QualityLevel = QualityLevel.STANDARD
    num_floors: int = Field(1, ge=1, le=200)
    include_parking: bool = False
    include_landscaping: bool = False
    timeline_months: Optional[int] = Field(None, ge=1, description="Project timeline in months")
    additional_requirements: Optional[str] = Field(None, description="Any special requirements")
    budget_hint: Optional[float] = Field(None, description="Target budget if any")


class CostEstimateResponse(BaseModel):
    estimate_id: Optional[str] = Field(None, description="ID if saved to database")
    project_name: str
    project_type: ProjectType
    location: str
    total_estimated_cost: float
    cost_per_sqft: float
    items: list[EstimateItem]
    confidence_score: float = Field(..., ge=0, le=1)
    cost_breakdown: dict[str, float] = Field(
        ..., description="Category -> total cost mapping"
    )
    timeline_estimate: Optional[str] = Field(None, description="Estimated project timeline")
    risk_factors: list[str] = Field(default_factory=list)
    recommendations: list[str] = Field(default_factory=list)
    disclaimer: str = Field(default="This is an AI-generated estimate. Actual costs may vary significantly based on market conditions, contractor availability, and site-specific factors.")
    saved_to_database: bool = False