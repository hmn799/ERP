-- CreateEnum
CREATE TYPE "PriceSource" AS ENUM ('MANUAL', 'PURCHASE_UPDATE', 'IMPORT', 'PROMOTION', 'SYSTEM');

-- AlterTable
ALTER TABLE "PriceHistory" ADD COLUMN     "priceSource" "PriceSource" NOT NULL DEFAULT 'MANUAL';
