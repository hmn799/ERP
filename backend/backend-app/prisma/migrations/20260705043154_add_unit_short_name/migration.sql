/*
  Warnings:

  - A unique constraint covering the columns `[shortName]` on the table `Unit` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `shortName` to the `Unit` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Unit" ADD COLUMN     "shortName" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Unit_shortName_key" ON "Unit"("shortName");

-- CreateIndex
CREATE INDEX "Unit_name_idx" ON "Unit"("name");

-- CreateIndex
CREATE INDEX "Unit_shortName_idx" ON "Unit"("shortName");
