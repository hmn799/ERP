/*
  Warnings:

  - You are about to drop the column `saleRate` on the `Item` table. All the data in the column will be lost.
  - Added the required column `distributorRate` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retailRate` to the `Item` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wholesaleRate` to the `Item` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Item" DROP COLUMN "saleRate",
ADD COLUMN     "distributorRate" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "retailRate" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "wholesaleRate" DECIMAL(12,2) NOT NULL;
