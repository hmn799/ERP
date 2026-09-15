import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const WAREHOUSE_ID = 'cms8kkhl300088mbsxs26jh3m';
const ITEM_ID = 'cms8kl773000a8mbsgth8gaoa';

async function main() {
  console.log('');
  console.log('==============================================');
  console.log(' STOCK BALANCE RECONCILIATION');
  console.log('==============================================');
  console.log('');

  const batches = await prisma.batch.findMany({
    where: {
      itemId: ITEM_ID,
    },
    orderBy: {
      batchNo: 'asc',
    },
  });

  for (const batch of batches) {
    console.log('----------------------------------------------');
    console.log(`Batch: ${batch.batchNo}`);
    console.log(`Batch ID: ${batch.id}`);

    // ============================================
    // WAREHOUSE STOCK
    // ============================================

    const warehouseStock =
      await prisma.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId: WAREHOUSE_ID,
            itemId: ITEM_ID,
            batchId: batch.id,
          },
        },
      });

    const storedBalance = warehouseStock
      ? Number(warehouseStock.quantity)
      : 0;

    // ============================================
    // STOCK LEDGER
    // ============================================

    const ledger =
      await prisma.stockLedger.findMany({
        where: {
          warehouseId: WAREHOUSE_ID,
          itemId: ITEM_ID,
          batchId: batch.id,
        },
        orderBy: {
          transactionDate: 'asc',
        },
      });

    let totalIn = 0;
    let totalOut = 0;

    for (const row of ledger) {
      totalIn += Number(row.qtyIn);
      totalOut += Number(row.qtyOut);
    }

    const calculatedBalance =
      totalIn - totalOut;

    console.log(`WarehouseStock : ${storedBalance}`);
    console.log(`Ledger Qty In  : ${totalIn}`);
    console.log(`Ledger Qty Out : ${totalOut}`);
    console.log(`Ledger Balance : ${calculatedBalance}`);
    console.log(
      `Difference     : ${storedBalance - calculatedBalance}`,
    );

    if (
      storedBalance === calculatedBalance
    ) {
      console.log('STATUS         : OK');
    } else {
      console.log(
        'STATUS         : MISMATCH',
      );
    }

    console.log('');
    console.log('Ledger Entries:');

    for (const row of ledger) {
      console.log(
        `${row.transactionDate.toISOString()} | ` +
        `${row.transactionType} | ` +
        `IN ${row.qtyIn} | ` +
        `OUT ${row.qtyOut} | ` +
        `${row.referenceType} | ` +
        `${row.referenceId}`,
      );
    }

    console.log('');
  }

  console.log('==============================================');
  console.log(' RECONCILIATION COMPLETE');
  console.log('==============================================');
}

main()
  .catch((error) => {
    console.error('');
    console.error('ERROR');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
