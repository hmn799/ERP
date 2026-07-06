-- CreateTable
CREATE TABLE "DocumentSeries" (
    "id" TEXT NOT NULL,
    "documentType" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "prefix" TEXT NOT NULL,
    "suffix" TEXT,
    "padding" INTEGER NOT NULL DEFAULT 6,
    "currentNumber" INTEGER NOT NULL DEFAULT 0,
    "resetYearly" BOOLEAN NOT NULL DEFAULT false,
    "financialYear" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DocumentSeries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "DocumentSeries_documentType_key" ON "DocumentSeries"("documentType");
