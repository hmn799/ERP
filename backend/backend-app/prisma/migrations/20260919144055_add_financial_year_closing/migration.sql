-- AlterTable
ALTER TABLE "FinancialYear" ADD COLUMN     "closedAt" TIMESTAMP(3),
ADD COLUMN     "isClosed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "FinancialYearClosingBalance" (
    "id" TEXT NOT NULL,
    "financialYearId" TEXT NOT NULL,
    "partyType" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "partyName" TEXT NOT NULL,
    "closingBalance" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "FinancialYearClosingBalance_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FinancialYearClosingBalance_partyType_partyId_idx" ON "FinancialYearClosingBalance"("partyType", "partyId");

-- CreateIndex
CREATE UNIQUE INDEX "FinancialYearClosingBalance_financialYearId_partyType_party_key" ON "FinancialYearClosingBalance"("financialYearId", "partyType", "partyId");

-- AddForeignKey
ALTER TABLE "FinancialYearClosingBalance" ADD CONSTRAINT "FinancialYearClosingBalance_financialYearId_fkey" FOREIGN KEY ("financialYearId") REFERENCES "FinancialYear"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
