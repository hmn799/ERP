-- DropIndex
DROP INDEX "public"."ItemPrice_itemId_priceListId_key";

-- CreateTable
CREATE TABLE "PartyPrice" (
    "id" TEXT NOT NULL,
    "customerId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "minimumPrice" DECIMAL(12,2),
    "maximumDiscountPercent" DECIMAL(5,2),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "allowManualOverride" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PartyPrice_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "PartyPrice_customerId_idx" ON "PartyPrice"("customerId");

-- CreateIndex
CREATE INDEX "PartyPrice_itemId_idx" ON "PartyPrice"("itemId");

-- CreateIndex
CREATE INDEX "PartyPrice_isActive_idx" ON "PartyPrice"("isActive");

-- CreateIndex
CREATE INDEX "ItemPrice_itemId_priceListId_idx" ON "ItemPrice"("itemId", "priceListId");

-- AddForeignKey
ALTER TABLE "PartyPrice" ADD CONSTRAINT "PartyPrice_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PartyPrice" ADD CONSTRAINT "PartyPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
