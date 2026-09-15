/*
  Warnings:

  - You are about to drop the column `barcode` on the `Batch` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[batchNo]` on the table `Batch` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `creationReason` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BatchStatus" AS ENUM ('ACTIVE', 'EXHAUSTED', 'EXPIRED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "BatchCreationReason" AS ENUM ('NEW_ITEM', 'PURCHASE_RATE_CHANGED', 'MRP_CHANGED', 'EXPIRY_CHANGED', 'MANUFACTURING_CHANGED', 'MANUAL');

-- DropIndex
DROP INDEX "public"."Batch_itemId_batchNo_key";

-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "barcode",
ADD COLUMN     "creationReason" "BatchCreationReason" NOT NULL,
ADD COLUMN     "lastPurchaseDate" TIMESTAMP(3),
ADD COLUMN     "manufacturingDate" TIMESTAMP(3),
ADD COLUMN     "purchaseBillId" TEXT,
ADD COLUMN     "status" "BatchStatus" NOT NULL DEFAULT 'ACTIVE';

-- CreateTable
CREATE TABLE "BatchBarcode" (
    "id" TEXT NOT NULL,
    "batchId" TEXT NOT NULL,
    "barcode" TEXT NOT NULL,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "BatchBarcode_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "BatchBarcode_barcode_key" ON "BatchBarcode"("barcode");

-- CreateIndex
CREATE INDEX "BatchBarcode_batchId_idx" ON "BatchBarcode"("batchId");

-- CreateIndex
CREATE UNIQUE INDEX "Batch_batchNo_key" ON "Batch"("batchNo");

-- AddForeignKey
ALTER TABLE "Batch" ADD CONSTRAINT "Batch_purchaseBillId_fkey" FOREIGN KEY ("purchaseBillId") REFERENCES "PurchaseBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "BatchBarcode" ADD CONSTRAINT "BatchBarcode_batchId_fkey" FOREIGN KEY ("batchId") REFERENCES "Batch"("id") ON DELETE CASCADE ON UPDATE CASCADE;
