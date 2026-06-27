"use client";

import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { api } from "@/lib/api";

interface EstimateItem {
  category: string;
  description: string;
  estimated_cost: number;
  unit?: string | null;
  quantity?: number | null;
  confidence: number;
  notes?: string | null;
}

interface EstimateResponse {
  project_name: string;
  project_type: string;
  location: string;
  total_estimated_cost: number;
  cost_per_sqft: number;
  items: EstimateItem[];
  confidence_score: number;
  cost_breakdown: Record<string, number>;
  timeline_estimate?: string;
  risk_factors: string[];
  recommendations: string[];
  disclaimer: string;
}

interface EstimateParams {
  project_name: string;
  project_type: "residential" | "commercial" | "industrial" | "infrastructure" | "renovation";
  building_size: "small" | "medium" | "large" | "xlarge";
  square_footage: number;
  location: string;
  quality_level: "basic" | "standard" | "premium" | "luxury";
  num_floors: number;
  include_parking: boolean;
  include_landscaping: boolean;
  timeline_months?: number;
  additional_requirements?: string;
  budget_hint?: number;
}

export function useAIEstimate(): UseMutationResult<EstimateResponse, Error, EstimateParams> {
  return useMutation<EstimateResponse, Error, EstimateParams>({
    mutationFn: async (params) => {
      const response = await api.post("/ai/estimate", params);
      return response.data.data as EstimateResponse;
    },
  });
}