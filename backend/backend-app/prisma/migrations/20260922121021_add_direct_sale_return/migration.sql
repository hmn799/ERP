-- DropForeignKey
ALTER TABLE "public"."SaleReturn" DROP CONSTRAINT "SaleReturn_salesBillId_fkey";

-- AlterTable
ALTER TABLE "SaleReturn" ALTER COLUMN "salesBillId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "SaleReturn" ADD CONSTRAINT "SaleReturn_salesBillId_fkey" FOREIGN KEY ("salesBillId") REFERENCES "SalesBill"("id") ON DELETE SET NULL ON UPDATE CASCADE;
