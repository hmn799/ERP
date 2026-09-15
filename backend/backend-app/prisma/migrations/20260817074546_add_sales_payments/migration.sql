-- CreateTable
CREATE TABLE "SalesPayment" (
    "id" TEXT NOT NULL,
    "salesBillId" TEXT NOT NULL,
    "paymentMode" TEXT NOT NULL,
    "amount" DECIMAL(14,2) NOT NULL,
    "cardSurcharge" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "transactionNo" TEXT,
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesPayment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SalesPayment_salesBillId_idx" ON "SalesPayment"("salesBillId");

-- CreateIndex
CREATE INDEX "SalesPayment_paymentMode_idx" ON "SalesPayment"("paymentMode");

-- AddForeignKey
ALTER TABLE "SalesPayment" ADD CONSTRAINT "SalesPayment_salesBillId_fkey" FOREIGN KEY ("salesBillId") REFERENCES "SalesBill"("id") ON DELETE CASCADE ON UPDATE CASCADE;
