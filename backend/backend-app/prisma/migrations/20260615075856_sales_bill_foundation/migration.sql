-- CreateTable
CREATE TABLE "SalesBill" (
    "id" TEXT NOT NULL,
    "billNo" TEXT NOT NULL,
    "billDate" TIMESTAMP(3) NOT NULL,
    "customerId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "salesmanId" TEXT,
    "grossAmount" DECIMAL(14,2) NOT NULL,
    "itemDiscountAmount" DECIMAL(14,2) NOT NULL,
    "billDiscountAmount" DECIMAL(14,2) NOT NULL,
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "cgstAmount" DECIMAL(14,2) NOT NULL,
    "sgstAmount" DECIMAL(14,2) NOT NULL,
    "igstAmount" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "isCredit" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SalesBill_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SalesBillItem" (
    "id" TEXT NOT NULL,
    "salesBillId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "qty" DECIMAL(14,2) NOT NULL,
    "saleRate" DECIMAL(12,2) NOT NULL,
    "discountPercent" DECIMAL(5,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "cgstAmount" DECIMAL(14,2) NOT NULL,
    "sgstAmount" DECIMAL(14,2) NOT NULL,
    "igstAmount" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SalesBillItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "SalesBill_billNo_key" ON "SalesBill"("billNo");

-- AddForeignKey
ALTER TABLE "SalesBill" ADD CONSTRAINT "SalesBill_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBill" ADD CONSTRAINT "SalesBill_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBill" ADD CONSTRAINT "SalesBill_salesmanId_fkey" FOREIGN KEY ("salesmanId") REFERENCES "Salesman"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillItem" ADD CONSTRAINT "SalesBillItem_salesBillId_fkey" FOREIGN KEY ("salesBillId") REFERENCES "SalesBill"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillItem" ADD CONSTRAINT "SalesBillItem_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillItem" ADD CONSTRAINT "SalesBillItem_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
