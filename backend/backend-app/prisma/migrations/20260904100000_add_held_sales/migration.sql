CREATE TABLE "HeldSale" (
    "id" TEXT NOT NULL,
    "holdName" TEXT,
    "customerId" TEXT,
    "warehouseId" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "HeldSale_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "HeldSale_customerId_idx" ON "HeldSale"("customerId");
CREATE INDEX "HeldSale_warehouseId_idx" ON "HeldSale"("warehouseId");
CREATE INDEX "HeldSale_updatedAt_idx" ON "HeldSale"("updatedAt");
