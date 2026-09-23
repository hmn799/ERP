-- AlterTable
ALTER TABLE "LedgerEntry" ADD COLUMN     "paymentMode" TEXT;

-- CreateIndex
CREATE INDEX "LedgerEntry_paymentMode_idx" ON "LedgerEntry"("paymentMode");
