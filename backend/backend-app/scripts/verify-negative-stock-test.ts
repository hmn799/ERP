import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const batchId = 'cmslaervd00018m5clw7kgxak';
  const warehouseId = 'cms8kkhl300088mbsxs26jh3m';

  const stock = await prisma.warehouseStock.findUnique({
    where: {
      warehouseId_itemId_batchId: {
        warehouseId,
        itemId: 'cms8kl773000a8mbsgth8gaoa',
        batchId,
      },
    },
  });

  const sales = await prisma.salesBill.findMany({
    where: {
      billNo: 'SBTEST001',
    },
  });

  const stockLedger = await prisma.stockLedger.findMany({
    where: {
      referenceId: {
        in: sales.map((sale) => sale.id),
      },
    },
  });

  const customerLedger = await prisma.ledgerEntry.findMany({
    where: {
      referenceId: {
        in: sales.map((sale) => sale.id),
      },
    },
  });

  console.log('========================================');
  console.log('NEGATIVE STOCK ROLLBACK CHECK');
  console.log('========================================');

  console.log('');
  console.log('WAREHOUSE STOCK');
  console.log('Batch: BATCH000002');
  console.log(
    'Quantity:',
    stock ? Number(stock.quantity) : 0,
  );

  console.log('');
  console.log('SBTEST001 SALES RECORDS:', sales.length);
  console.log('STOCK LEDGER RECORDS:', stockLedger.length);
  console.log('CUSTOMER LEDGER RECORDS:', customerLedger.length);

  console.log('');
  console.log('========================================');
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
