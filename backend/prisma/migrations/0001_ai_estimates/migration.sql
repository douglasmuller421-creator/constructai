-- CreateTable
CREATE TABLE "ai_estimates" (
    "id" TEXT NOT NULL,
    "estimateId" TEXT NOT NULL,
    "projectName" TEXT NOT NULL,
    "projectType" TEXT NOT NULL,
    "location" TEXT NOT NULL,
    "squareFootage" DOUBLE PRECISION NOT NULL,
    "qualityLevel" TEXT NOT NULL,
    "totalEstimatedCost" DOUBLE PRECISION NOT NULL,
    "costPerSqft" DOUBLE PRECISION NOT NULL,
    "confidenceScore" DOUBLE PRECISION NOT NULL,
    "items" JSONB NOT NULL,
    "costBreakdown" JSONB NOT NULL,
    "timelineEstimate" TEXT,
    "riskFactors" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "recommendations" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "projectId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ai_estimates_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ai_estimates_estimateId_key" ON "ai_estimates"("estimateId");

-- CreateIndex
CREATE INDEX "ai_estimates_projectId_idx" ON "ai_estimates"("projectId");

-- AddForeignKey
ALTER TABLE "ai_estimates" ADD CONSTRAINT "ai_estimates_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;