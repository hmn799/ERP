/*
  Warnings:

  - You are about to drop the column `saleRate` on the `Batch` table. All the data in the column will be lost.
  - You are about to drop the column `distributorRate` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `retailRate` on the `Item` table. All the data in the column will be lost.
  - You are about to drop the column `wholesaleRate` on the `Item` table. All the data in the column will be lost.
  - Added the required column `distributorRate` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `retailRate` to the `Batch` table without a default value. This is not possible if the table is not empty.
  - Added the required column `wholesaleRate` to the `Batch` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Batch" DROP COLUMN "saleRate",
ADD COLUMN     "distributorRate" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "retailRate" DECIMAL(12,2) NOT NULL,
ADD COLUMN     "wholesaleRate" DECIMAL(12,2) NOT NULL;

-- AlterTable
ALTER TABLE "Item" DROP COLUMN "distributorRate",
DROP COLUMN "retailRate",
DROP COLUMN "wholesaleRate";
