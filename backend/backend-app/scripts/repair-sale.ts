import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const SALES_ID = 'cmsq44enc00018m5opm1ov05a';

async function main() {
  console.log('========================================');
  console.log(' SALES TRANSACTION REPAIR');
  console.log('========================================');
  console.log(`Sales ID: ${SALES_ID}`);
  console.log('');

  await prisma.$transaction(async (tx) => {
    // =====================================================
    // 1. FIND SALES BILL
    // =====================================================

    const sale = await tx.salesBill.findUnique({
      where: {
        id: SALES_ID,
      },
      include: {
        items: true,
      },
    });

    if (!sale) {
      throw new Error(
        `Sales bill not found: ${SALES_ID}`,
      );
    }

    console.log(`Bill No       : ${sale.billNo}`);
    console.log(`Customer ID   : ${sale.customerId}`);
    console.log(`Warehouse ID  : ${sale.warehouseId}`);
    console.log(`Net Amount    : ${sale.netAmount}`);
    console.log(`Is Credit     : ${sale.isCredit}`);
    console.log(`Items         : ${sale.items.length}`);
    console.log('');

    if (sale.items.length === 0) {
      throw new Error(
        'Sales bill has no items. Repair stopped.',
      );
    }

    // =====================================================
    // 2. PROCESS EACH SALES ITEM
    // =====================================================

    for (const item of sale.items) {
      console.log('----------------------------------------');
      console.log(`Item ID      : ${item.itemId}`);
      console.log(`Batch ID     : ${item.batchId}`);
      console.log(`Qty          : ${item.qty}`);
      console.log('');

      // ===================================================
      // CHECK WAREHOUSE STOCK
      // ===================================================

      const stock =
        await tx.warehouseStock.findUnique({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: sale.warehouseId,
              itemId: item.itemId,
              batchId: item.batchId,
            },
          },
        });

      if (!stock) {
        throw new Error(
          `WarehouseStock row not found for item ${item.itemId}, batch ${item.batchId}. Repair stopped.`,
        );
      }

      console.log(
        `Current WarehouseStock: ${stock.quantity}`,
      );

      // IMPORTANT:
      // We are NOT modifying WarehouseStock.
      console.log(
        'WarehouseStock: NOT MODIFIED',
      );

      // ===================================================
      // CHECK STOCK LEDGER
      // ===================================================

      const existingStockLedger =
        await tx.stockLedger.findFirst({
          where: {
            referenceType: 'SALE',
            referenceId: sale.id,
            itemId: item.itemId,
            batchId: item.batchId,
            warehouseId: sale.warehouseId,
          },
        });

      if (existingStockLedger) {
        console.log(
          `StockLedger already exists: ${existingStockLedger.id}`,
        );
        console.log(
          'Skipping StockLedger creation.',
        );
      } else {
        await tx.stockLedger.create({
          data: {
            transactionDate: sale.billDate,

            transactionType: 'SALE',

            itemId: item.itemId,
            batchId: item.batchId,
            warehouseId: sale.warehouseId,

            qtyIn: 0,
            qtyOut: Number(item.qty),

            referenceType: 'SALE',
            referenceId: sale.id,

            remarks: 'Sales Entry',
          },
        });

        console.log(
          'StockLedger: CREATED',
        );
      }
    }

    // =====================================================
    // 3. CUSTOMER LEDGER
    // =====================================================

    if (
      sale.isCredit &&
      sale.customerId
    ) {
      const existingCustomerLedger =
        await tx.ledgerEntry.findFirst({
          where: {
            partyType: 'CUSTOMER',
            partyId: sale.customerId,
            transactionType: 'SALE',
            referenceType: 'SALE',
            referenceId: sale.id,
          },
        });

      if (existingCustomerLedger) {
        console.log('');
        console.log(
          `Customer Ledger already exists: ${existingCustomerLedger.id}`,
        );
        console.log(
          'Skipping Customer Ledger creation.',
        );
      } else {
        await tx.ledgerEntry.create({
          data: {
            transactionDate: sale.billDate,

            partyType: 'CUSTOMER',
            partyId: sale.customerId,

            transactionType: 'SALE',

            referenceType: 'SALE',
            referenceId: sale.id,

            debitAmount: Number(
              sale.netAmount,
            ),

            creditAmount: 0,

            remarks: 'Credit Sales Bill',
          },
        });

        console.log('');
        console.log(
          'Customer Ledger: CREATED',
        );
      }
    } else {
      console.log('');
      console.log(
        'Cash sale detected - Customer Ledger not required.',
      );
    }

    console.log('');
    console.log('========================================');
    console.log(' REPAIR COMPLETED');
    console.log('========================================');
  });
}

main()
  .catch((error) => {
    console.error('');
    console.error('========================================');
    console.error(' REPAIR FAILED');
    console.error('========================================');
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
