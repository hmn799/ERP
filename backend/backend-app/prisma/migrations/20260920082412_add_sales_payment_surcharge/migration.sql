/*
  Warnings:

  - You are about to drop the column `cardSurcharge` on the `SalesPayment` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "SalesPayment" DROP COLUMN "cardSurcharge",
ADD COLUMN     "surchargeAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
ADD COLUMN     "surchargeType" TEXT NOT NULL DEFAULT 'AMOUNT',
ADD COLUMN     "surchargeValue" DECIMAL(14,2) NOT NULL DEFAULT 0;
