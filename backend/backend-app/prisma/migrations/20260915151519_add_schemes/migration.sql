-- CreateEnum
CREATE TYPE "SchemeType" AS ENUM ('QUANTITY', 'FREE_ITEM', 'DISCOUNT');

-- AlterTable
ALTER TABLE "SalesBillItem" ADD COLUMN     "freeQty" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "schemeId" TEXT;

-- CreateTable
CREATE TABLE "Scheme" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "schemeType" "SchemeType" NOT NULL,
    "itemId" TEXT NOT NULL,
    "buyQty" DECIMAL(10,2),
    "freeQty" DECIMAL(10,2),
    "freeItemId" TEXT,
    "discountPercent" DECIMAL(5,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "effectiveFrom" TIMESTAMP(3),
    "effectiveTo" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Scheme_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Scheme_itemId_idx" ON "Scheme"("itemId");

-- CreateIndex
CREATE INDEX "Scheme_isActive_idx" ON "Scheme"("isActive");

-- CreateIndex
CREATE INDEX "SalesBillItem_schemeId_idx" ON "SalesBillItem"("schemeId");

-- AddForeignKey
ALTER TABLE "Scheme" ADD CONSTRAINT "Scheme_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Scheme" ADD CONSTRAINT "Scheme_freeItemId_fkey" FOREIGN KEY ("freeItemId") REFERENCES "Item"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SalesBillItem" ADD CONSTRAINT "SalesBillItem_schemeId_fkey" FOREIGN KEY ("schemeId") REFERENCES "Scheme"("id") ON DELETE SET NULL ON UPDATE CASCADE;
