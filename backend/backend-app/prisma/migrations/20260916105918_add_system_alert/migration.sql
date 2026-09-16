-- CreateTable
CREATE TABLE "SystemAlert" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "source" TEXT,
    "details" JSONB,
    "acknowledgedAt" TIMESTAMP(3),
    "acknowledgedById" TEXT,
    "acknowledgedByName" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SystemAlert_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SystemAlert_category_idx" ON "SystemAlert"("category");

-- CreateIndex
CREATE INDEX "SystemAlert_severity_idx" ON "SystemAlert"("severity");

-- CreateIndex
CREATE INDEX "SystemAlert_createdAt_idx" ON "SystemAlert"("createdAt");
