import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SALES_ID = 'cmsq44enc00018m5opm1ov05a';

async function main() {
  console.log('========================================');
  console.log('DIRECT DATABASE CHECK');
  console.log('========================================');

  const stock = await prisma.stockLedger.findMany({
    where: {
      referenceId: SALES_ID,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  console.log('');
  console.log('STOCK LEDGER RECORDS');
  console.log('Count:', stock.length);
  console.log('');

  for (const row of stock) {
    console.log(JSON.stringify(row, null, 2));
  }

  const customer = await prisma.ledgerEntry.findMany({
    where: {
      referenceId: SALES_ID,
    },
    orderBy: {
      transactionDate: 'asc',
    },
  });

  console.log('');
  console.log('CUSTOMER LEDGER RECORDS');
  console.log('Count:', customer.length);
  console.log('');

  for (const row of customer) {
    console.log(JSON.stringify(row, null, 2));
  }

  console.log('');
  console.log('========================================');
  console.log('CHECK COMPLETE');
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
