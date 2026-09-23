-- CreateTable
CREATE TABLE "AdjustmentNote" (
    "id" TEXT NOT NULL,
    "noteNo" TEXT NOT NULL,
    "noteType" TEXT NOT NULL,
    "noteDate" TIMESTAMP(3) NOT NULL,
    "partyType" TEXT NOT NULL,
    "partyId" TEXT NOT NULL,
    "reason" TEXT NOT NULL,
    "referenceType" TEXT,
    "referenceId" TEXT,
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "cgstAmount" DECIMAL(14,2) NOT NULL,
    "sgstAmount" DECIMAL(14,2) NOT NULL,
    "igstAmount" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "AdjustmentNote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AdjustmentNoteItem" (
    "id" TEXT NOT NULL,
    "adjustmentNoteId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "hsnCode" TEXT,
    "taxableAmount" DECIMAL(14,2) NOT NULL,
    "gstPercent" DECIMAL(5,2) NOT NULL,
    "cgstAmount" DECIMAL(14,2) NOT NULL,
    "sgstAmount" DECIMAL(14,2) NOT NULL,
    "igstAmount" DECIMAL(14,2) NOT NULL,
    "netAmount" DECIMAL(14,2) NOT NULL,

    CONSTRAINT "AdjustmentNoteItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StockDamage" (
    "id" TEXT NOT NULL,
    "damageNo" TEXT NOT NULL,
    "damageDate" TIMESTAMP(3) NOT NULL,
    "warehouseId" TEXT NOT NULL,
    "itemId" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "qty" DECIMAL(14,2) NOT NULL,
    "costValue" DECIMAL(14,2) NOT NULL,
    "reason" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StockDamage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PettyExpense" (
    "id" TEXT NOT NULL,
    "expenseNo" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(12,2) NOT NULL,
    "paymentMode" TEXT NOT NULL DEFAULT 'CASH',
    "remarks" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "PettyExpense_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "AdjustmentNote_noteNo_key" ON "AdjustmentNote"("noteNo");

-- CreateIndex
CREATE INDEX "AdjustmentNote_partyType_partyId_idx" ON "AdjustmentNote"("partyType", "partyId");

-- CreateIndex
CREATE INDEX "AdjustmentNote_noteType_idx" ON "AdjustmentNote"("noteType");

-- CreateIndex
CREATE INDEX "AdjustmentNote_noteDate_idx" ON "AdjustmentNote"("noteDate");

-- CreateIndex
CREATE INDEX "AdjustmentNoteItem_adjustmentNoteId_idx" ON "AdjustmentNoteItem"("adjustmentNoteId");

-- CreateIndex
CREATE UNIQUE INDEX "StockDamage_damageNo_key" ON "StockDamage"("damageNo");

-- CreateIndex
CREATE INDEX "StockDamage_warehouseId_idx" ON "StockDamage"("warehouseId");

-- CreateIndex
CREATE INDEX "StockDamage_itemId_idx" ON "StockDamage"("itemId");

-- CreateIndex
CREATE INDEX "StockDamage_batchId_idx" ON "StockDamage"("batchId");

-- CreateIndex
CREATE INDEX "StockDamage_damageDate_idx" ON "StockDamage"("damageDate");

-- CreateIndex
CREATE UNIQUE INDEX "PettyExpense_expenseNo_key" ON "PettyExpense"("expenseNo");

-- CreateIndex
CREATE INDEX "PettyExpense_expenseDate_idx" ON "PettyExpense"("expenseDate");

-- CreateIndex
CREATE INDEX "PettyExpense_category_idx" ON "PettyExpense"("category");

-- AddForeignKey
ALTER TABLE "AdjustmentNoteItem" ADD CONSTRAINT "AdjustmentNoteItem_adjustmentNoteId_fkey" FOREIGN KEY ("adjustmentNoteId") REFERENCES "AdjustmentNote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDamage" ADD CONSTRAINT "StockDamage_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDamage" ADD CONSTRAINT "StockDamage_itemId_fkey" FOREIGN KEY ("itemId") REFERENCES "Item"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StockDamage" ADD CONSTRAINT "StockDamage_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
