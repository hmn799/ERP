-- AlterTable
ALTER TABLE "PriceList" ADD COLUMN     "color" TEXT,
ADD COLUMN     "sortOrder" INTEGER NOT NULL DEFAULT 1,
ADD COLUMN     "systemDefined" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ItemPrice" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "salePrice" DECIMAL(12,2) NOT NULL,
    "minimumPrice" DECIMAL(12,2),
    "maximumDiscountPercent" DECIMAL(5,2),
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "allowManualOverride" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ItemPrice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PriceHistory" (
    "id" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "priceListId" TEXT NOT NULL,
    "oldPrice" DECIMAL(12,2) NOT NULL,
    "newPrice" DECIMAL(12,2) NOT NULL,
    "changedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changedBy" TEXT,
    "remarks" TEXT,

    CONSTRAINT "PriceHistory_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ItemPrice_itemId_idx" ON "ItemPrice"("itemId");

-- CreateIndex
CREATE INDEX "ItemPrice_priceListId_idx" ON "ItemPrice"("priceListId");

-- CreateIndex
CREATE INDEX "ItemPrice_isActive_idx" ON "ItemPrice"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "ItemPrice_itemId_priceListId_key" ON "ItemPrice"("itemId", "priceListId");

-- CreateIndex
CREATE INDEX "PriceHistory_itemId_idx" ON "PriceHistory"("itemId");

-- CreateIndex
CREATE INDEX "PriceHistory_priceListId_idx" ON "PriceHistory"("priceListId");

-- CreateIndex
CREATE INDEX "PriceList_name_idx" ON "PriceList"("name");

-- CreateIndex
CREATE INDEX "PriceList_priority_idx" ON "PriceList"("priority");

-- CreateIndex
CREATE INDEX "PriceList_sortOrder_idx" ON "PriceList"("sortOrder");

-- CreateIndex
CREATE INDEX "PriceList_isDefault_idx" ON "PriceList"("isDefault");

-- AddForeignKey
ALTER TABLE "ItemPrice" ADD CONSTRAINT "ItemPrice_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ItemPrice" ADD CONSTRAINT "ItemPrice_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PriceHistory" ADD CONSTRAINT "PriceHistory_priceListId_fkey" FOREIGN KEY ("priceListId") REFERENCES "PriceList"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
