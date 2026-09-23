-- AlterEnum
ALTER TYPE "BatchCreationReason" ADD VALUE 'GENERAL_ITEM';

-- AlterTable
ALTER TABLE "Item" ADD COLUMN     "isGeneralItem" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "SalesBillItem" ADD COLUMN     "description" TEXT;
