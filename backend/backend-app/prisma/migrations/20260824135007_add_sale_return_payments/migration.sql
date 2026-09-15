-- CreateTable
CREATE TABLE "SaleReturnPayment" (
    "id" TEXT NOT NULL,
    "saleReturnId" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "cardSurcharge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "transactionNo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SaleReturnPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SaleReturnPayment_saleReturnId_idx" ON "SaleReturnPayment"("saleReturnId");

-- CreateIndex
CREATE INDEX "SaleReturnPayment_paymentMode_idx" ON "SaleReturnPayment"("paymentMode");

-- AddForeignKey
ALTER TABLE "SaleReturnPayment" ADD CONSTRAINT "SaleReturnPayment_saleReturnId_fkey" FOREIGN KEY ("saleReturnId") REFERENCES "SaleReturn"("id") ON DELETE CASCADE ON UPDATE CASCADE;
