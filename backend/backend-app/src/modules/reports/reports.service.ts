import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async supplierOutstanding() {
    const suppliers =
      await this.prisma.supplier.findMany({
        where: {
          isActive: true,
        },
      });

    const result: any[] = [];

    for (const supplier of suppliers) {
      const entries =
        await this.prisma.ledgerEntry.findMany({
          where: {
            partyType: 'SUPPLIER',
            partyId: supplier.id,
          },
        });

      let debit = 0;
      let credit = 0;

      for (const row of entries) {
        debit += Number(row.debitAmount);
        credit += Number(row.creditAmount);
      }

      result.push({
        supplierId: supplier.id,
        supplierCode: supplier.supplierCode,
        supplierName: supplier.name,
        debit,
        credit,
        outstanding: credit - debit,
      });
    }

    return result;
  }

  async customerOutstanding() {
    const customers =
      await this.prisma.customer.findMany({
        where: {
          isActive: true,
        },
      });

    const result: any[] = [];

    for (const customer of customers) {
      const entries =
        await this.prisma.ledgerEntry.findMany({
          where: {
            partyType: 'CUSTOMER',
            partyId: customer.id,
          },
        });

      let debit = 0;
      let credit = 0;

      for (const row of entries) {
        debit += Number(row.debitAmount);
        credit += Number(row.creditAmount);
      }

      result.push({
        customerId: customer.id,
        customerCode: customer.customerCode,
        customerName: customer.name,
        debit,
        credit,
        outstanding: debit - credit,
      });
    }

    return result;
  }

  async customerLedger(
    customerId: string,
  ) {
    const rows =
      await this.prisma.ledgerEntry.findMany({
        where: {
          partyType: 'CUSTOMER',
          partyId: customerId,
        },
        orderBy: {
          transactionDate: 'asc',
        },
      });

    let balance = 0;

    return rows.map((row) => {
      balance +=
        Number(row.debitAmount) -
        Number(row.creditAmount);

      return {
        date: row.transactionDate,
        type: row.transactionType,
        referenceId: row.referenceId,
        debit: Number(row.debitAmount),
        credit: Number(row.creditAmount),
        balance,
        remarks: row.remarks,
      };
    });
  }

  async supplierLedger(
    supplierId: string,
  ) {
    const rows =
      await this.prisma.ledgerEntry.findMany({
        where: {
          partyType: 'SUPPLIER',
          partyId: supplierId,
        },
        orderBy: {
          transactionDate: 'asc',
        },
      });

    let balance = 0;

    return rows.map((row) => {
      balance +=
        Number(row.creditAmount) -
        Number(row.debitAmount);

      return {
        date: row.transactionDate,
        type: row.transactionType,
        referenceId: row.referenceId,
        debit: Number(row.debitAmount),
        credit: Number(row.creditAmount),
        balance,
        remarks: row.remarks,
      };
    });
  }

  async customerStatement(
  customerId: string,
  from: string,
  to: string,
) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const allRows =
    await this.prisma.ledgerEntry.findMany({
      where: {
        partyType: 'CUSTOMER',
        partyId: customerId,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

  let openingBalance = 0;

  for (const row of allRows) {
    if (row.transactionDate < fromDate) {
      openingBalance +=
        Number(row.debitAmount) -
        Number(row.creditAmount);
    }
  }

  const rows = allRows.filter(
    (x) =>
      x.transactionDate >= fromDate &&
      x.transactionDate <= toDate,
  );

  let runningBalance = openingBalance;

  const transactions = rows.map((row) => {
    runningBalance +=
      Number(row.debitAmount) -
      Number(row.creditAmount);

    return {
      date: row.transactionDate,
      type: row.transactionType,
      referenceId: row.referenceId,
      debit: Number(row.debitAmount),
      credit: Number(row.creditAmount),
      balance: runningBalance,
      remarks: row.remarks,
    };
  });

  return {
    openingBalance,
    transactions,
    closingBalance: runningBalance,
  };
}

async supplierStatement(
  supplierId: string,
  from: string,
  to: string,
) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const allRows =
    await this.prisma.ledgerEntry.findMany({
      where: {
        partyType: 'SUPPLIER',
        partyId: supplierId,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

  let openingBalance = 0;

  for (const row of allRows) {
    if (row.transactionDate < fromDate) {
      openingBalance +=
        Number(row.creditAmount) -
        Number(row.debitAmount);
    }
  }

  const rows = allRows.filter(
    (x) =>
      x.transactionDate >= fromDate &&
      x.transactionDate <= toDate,
  );

  let runningBalance = openingBalance;

  const transactions = rows.map((row) => {
    runningBalance +=
      Number(row.creditAmount) -
      Number(row.debitAmount);

    return {
      date: row.transactionDate,
      type: row.transactionType,
      referenceId: row.referenceId,
      debit: Number(row.debitAmount),
      credit: Number(row.creditAmount),
      balance: runningBalance,
      remarks: row.remarks,
    };
  });

  return {
    openingBalance,
    transactions,
    closingBalance: runningBalance,
  };
}
    async dayBook(
  from: string,
  to: string,
) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const rows =
    await this.prisma.ledgerEntry.findMany({
      where: {
        transactionDate: {
          gte: fromDate,
          lte: toDate,
        },
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

  let balance = 0;

  return rows.map((row) => {
    balance +=
      Number(row.debitAmount) -
      Number(row.creditAmount);

    return {
      date: row.transactionDate,
      partyType: row.partyType,
      partyId: row.partyId,
      type: row.transactionType,
      referenceType: row.referenceType,
      referenceId: row.referenceId,
      debit: Number(row.debitAmount),
      credit: Number(row.creditAmount),
      balance,
      remarks: row.remarks,
    };
  });
}

    async cashBook(
  from: string,
  to: string,
) {
  const fromDate = new Date(from);
  const toDate = new Date(to);

  const rows =
    await this.prisma.ledgerEntry.findMany({
      where: {
        transactionDate: {
          gte: fromDate,
          lte: toDate,
        },

        OR: [
          {
            transactionType: 'RECEIPT',
          },
          {
            transactionType: 'PAYMENT',
          },
        ],
      },

      orderBy: {
        transactionDate: 'asc',
      },
    });

  let balance = 0;

  return rows.map((row) => {
    const receipt =
      Number(row.creditAmount);

    const payment =
      Number(row.debitAmount);

    balance += receipt - payment;

    return {
      date: row.transactionDate,
      partyType: row.partyType,
      partyId: row.partyId,
      type: row.transactionType,
      receipt,
      payment,
      balance,
      remarks: row.remarks,
    };
  });
}

async stockReport() {
  const items =
    await this.prisma.item.findMany({
      where: {
        isActive: true,
      },
    });

  const result: any[] = [];

  for (const item of items) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          itemId: item.id,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const row of entries) {
      qtyIn += Number(row.qtyIn);
      qtyOut += Number(row.qtyOut);
    }

    result.push({
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      stock: qtyIn - qtyOut,
    });
  }

  return result;
}
async batchStockReport() {
  const batches =
    await this.prisma.batch.findMany({
      include: {
        item: true,
      },
    });

  const result: any[] = [];

  for (const batch of batches) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          batchId: batch.id,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const row of entries) {
      qtyIn += Number(row.qtyIn);
      qtyOut += Number(row.qtyOut);
    }

    result.push({
      itemCode: batch.item.itemCode,
      itemName: batch.item.name,

      batchId: batch.id,
      batchNo: batch.batchNo,

      mrp: Number(batch.mrp),

      purchaseRate: Number(batch.purchaseRate),

      stock: qtyIn - qtyOut,

      expiryDate: batch.expiryDate,
    });
  }

  return result;
}

async expiryReport() {
  const batches =
    await this.prisma.batch.findMany({
      include: {
        item: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });

  const result: any[] = [];

  for (const batch of batches) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          batchId: batch.id,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const row of entries) {
      qtyIn += Number(row.qtyIn);
      qtyOut += Number(row.qtyOut);
    }

    const stock = qtyIn - qtyOut;

    if (stock <= 0) {
      continue;
    }

    result.push({
      itemCode: batch.item.itemCode,
      itemName: batch.item.name,

      batchNo: batch.batchNo,

      stock,

      mrp: Number(batch.mrp),

      expiryDate: batch.expiryDate,
    });
  }

  return result;
}

async profitReport() {
  const salesItems =
    await this.prisma.salesBillItem.findMany({
      include: {
        item: true,
        batch: true,
      },
    });

  const result: any[] = [];

  for (const row of salesItems) {
    const qty = Number(row.qty);

    const saleValue =
      Number(row.netAmount);

    const costValue =
      qty *
      Number(row.batch.purchaseRate);

    const profit =
      saleValue - costValue;

    result.push({
      itemCode: row.item.itemCode,
      itemName: row.item.name,

      batchNo: row.batch.batchNo,

      qty,

      saleRate: Number(row.saleRate),

      saleValue,

      purchaseRate:
        Number(row.batch.purchaseRate),

      costValue,

      profit,
    });
  }

  return result;
}

async itemSalesReport() {
  const salesItems =
    await this.prisma.salesBillItem.findMany({
      include: {
        item: true,
      },
    });

  const map = new Map();

  for (const row of salesItems) {
    const itemId = row.itemId;

    if (!map.has(itemId)) {
      map.set(itemId, {
        itemId,
        itemCode: row.item.itemCode,
        itemName: row.item.name,
        qtySold: 0,
        salesValue: 0,
      });
    }

    const current = map.get(itemId);

    current.qtySold += Number(row.qty);
    current.salesValue += Number(row.netAmount);
  }

  return Array.from(map.values()).map((x: any) => ({
    ...x,
    qtySold: Number(x.qtySold.toFixed(2)),
    salesValue: Number(x.salesValue.toFixed(2)),
  }));
}

async partySalesReport() {
  const bills =
    await this.prisma.salesBill.findMany({
      include: {
        customer: true,
      },
    });

  const map = new Map();

  for (const bill of bills) {
    if (!bill.customer) {
      continue;
    }

    const customerId =
      bill.customer.id;

    if (!map.has(customerId)) {
      map.set(customerId, {
        customerId,
        customerCode:
          bill.customer.customerCode,
        customerName:
          bill.customer.name,
        billCount: 0,
        salesValue: 0,
      });
    }

    const current =
      map.get(customerId);

    current.billCount += 1;

    current.salesValue +=
      Number(bill.netAmount);
  }

  return Array.from(
    map.values(),
  ).map((x: any) => ({
    ...x,
    salesValue: Number(
      x.salesValue.toFixed(2),
    ),
  }));
}

async fastMovingItems() {
  const salesItems =
    await this.prisma.salesBillItem.findMany({
      include: {
        item: true,
      },
    });

  const map = new Map();

  for (const row of salesItems) {
    const itemId = row.itemId;

    if (!map.has(itemId)) {
      map.set(itemId, {
        itemId,
        itemCode: row.item.itemCode,
        itemName: row.item.name,
        qtySold: 0,
        salesValue: 0,
      });
    }

    const current = map.get(itemId);

    current.qtySold += Number(row.qty);

    current.salesValue += Number(
      row.netAmount,
    );
  }

  return Array.from(map.values())
    .sort(
      (a: any, b: any) =>
        b.qtySold - a.qtySold,
    )
    .map((x: any) => ({
      ...x,
      qtySold: Number(
        x.qtySold.toFixed(2),
      ),
      salesValue: Number(
        x.salesValue.toFixed(2),
      ),
    }));
}

async deadStockReport() {
  const items =
    await this.prisma.item.findMany({
      where: {
        isActive: true,
      },
    });

  const result: any[] = [];

  for (const item of items) {
    const sales =
      await this.prisma.salesBillItem.findMany({
        where: {
          itemId: item.id,
        },
        include: {
          salesBill: true,
        },
        orderBy: {
          salesBill: {
            billDate: 'desc',
          },
        },
        take: 1,
      });

    let lastSoldDate: Date | null = null;
    let daysSinceLastSale: number | null = null;

    if (sales.length > 0) {
      lastSoldDate =
        sales[0].salesBill.billDate;

      const diff =
  Date.now() -
  lastSoldDate.getTime();

      daysSinceLastSale =
        Math.floor(
          diff / (1000 * 60 * 60 * 24),
        );
    }

    result.push({
      itemId: item.id,
      itemCode: item.itemCode,
      itemName: item.name,
      lastSoldDate,
      daysSinceLastSale,
    });
  }

  return result.sort((a, b) => {
    const x = a.daysSinceLastSale ?? 999999;
    const y = b.daysSinceLastSale ?? 999999;

    return y - x;
  });
}

async dashboard() {
  const salesBills =
    await this.prisma.salesBill.findMany();

  const purchaseBills =
    await this.prisma.purchaseBill.findMany();

  const ledgerEntries =
    await this.prisma.ledgerEntry.findMany();

  const stockEntries =
    await this.prisma.stockLedger.findMany();

  const items =
    await this.prisma.item.findMany({
      where: {
        isActive: true,
      },
    });

  let todaySales = 0;
  let todayPurchase = 0;

  for (const bill of salesBills) {
    todaySales += Number(bill.netAmount);
  }

  for (const bill of purchaseBills) {
    todayPurchase += Number(bill.netAmount);
  }

  let customerOutstanding = 0;
  let supplierOutstanding = 0;

  for (const row of ledgerEntries) {
    if (row.partyType === 'CUSTOMER') {
      customerOutstanding +=
        Number(row.debitAmount) -
        Number(row.creditAmount);
    }

    if (row.partyType === 'SUPPLIER') {
      supplierOutstanding +=
        Number(row.creditAmount) -
        Number(row.debitAmount);
    }
  }

  let stockQty = 0;

  for (const row of stockEntries) {
    stockQty +=
      Number(row.qtyIn) -
      Number(row.qtyOut);
  }

  const salesItems =
    await this.prisma.salesBillItem.findMany({
      include: {
        batch: true,
      },
    });

  let totalProfit = 0;

  for (const row of salesItems) {
    const qty = Number(row.qty);

    const saleValue =
      Number(row.netAmount);

    const costValue =
      qty *
      Number(row.batch.purchaseRate);

    totalProfit +=
      saleValue - costValue;
  }

  const deadStock =
    await this.deadStockReport();

  const fastMoving =
    await this.fastMovingItems();

 return {
  totalSales:
    Number(todaySales.toFixed(2)),

  totalPurchase:
    Number(todayPurchase.toFixed(2)),

  customerOutstanding:
    Number(
      customerOutstanding.toFixed(2),
    ),

  supplierOutstanding:
    Number(
      supplierOutstanding.toFixed(2),
    ),

  stockItems:
    items.length,

  stockQty:
    Number(stockQty.toFixed(2)),

  totalProfit:
    Number(totalProfit.toFixed(2)),

  deadStockItems:
    deadStock.filter(
      (x) => x.lastSoldDate === null,
    ).length,

  fastMovingItems:
    fastMoving.slice(0, 5),
};
}

async salesRegister() {
  const bills =
    await this.prisma.salesBill.findMany({
      include: {
        customer: true,
        salesman: true,
        warehouse: true,
      },
      orderBy: {
        billDate: 'desc',
      },
    });

  return bills.map((bill) => ({
    salesBillId: bill.id,

    billNo: bill.billNo,

    billDate: bill.billDate,

   customerCode:
  bill.customer?.customerCode ??
  'CASH',

customerName:
  bill.customer?.name ??
  'CASH SALE',

    salesman:
      bill.salesman?.name,

    warehouse:
      bill.warehouse?.name,

    grossAmount:
      Number(bill.grossAmount),

    taxableAmount:
      Number(bill.taxableAmount),

    cgstAmount:
      Number(bill.cgstAmount),

    sgstAmount:
      Number(bill.sgstAmount),

    igstAmount:
      Number(bill.igstAmount),

    netAmount:
      Number(bill.netAmount),

    isCredit:
      bill.isCredit,
  }));
}

async purchaseRegister() {
  const bills =
    await this.prisma.purchaseBill.findMany({
      include: {
        supplier: true,
        warehouse: true,
      },
      orderBy: {
        billDate: 'desc',
      },
    });

  return bills.map((bill) => ({
    purchaseBillId: bill.id,

    billNo: bill.billNo,
    billDate: bill.billDate,

    supplierCode:
      bill.supplier?.supplierCode,

    supplierName:
      bill.supplier?.name,

    warehouse:
      bill.warehouse?.name,

    grossAmount:
      Number(bill.grossAmount),

    taxableAmount:
      Number(bill.taxableAmount),

    cgstAmount:
      Number(bill.cgstAmount),

    sgstAmount:
      Number(bill.sgstAmount),

    igstAmount:
      Number(bill.igstAmount),

    netAmount:
      Number(bill.netAmount),
  }));
}

async gstSummary() {
  const sales =
    await this.prisma.salesBill.findMany();

  const purchases =
    await this.prisma.purchaseBill.findMany();

  let taxableAmount = 0;
  let cgstAmount = 0;
  let sgstAmount = 0;
  let igstAmount = 0;

  for (const bill of sales) {
    taxableAmount += Number(bill.taxableAmount);
    cgstAmount += Number(bill.cgstAmount);
    sgstAmount += Number(bill.sgstAmount);
    igstAmount += Number(bill.igstAmount);
  }

  for (const bill of purchases) {
    taxableAmount += Number(bill.taxableAmount);
    cgstAmount += Number(bill.cgstAmount);
    sgstAmount += Number(bill.sgstAmount);
    igstAmount += Number(bill.igstAmount);
  }

  return {
    taxableAmount,
    cgstAmount,
    sgstAmount,
    igstAmount,
    salesCount: sales.length,
    purchaseCount: purchases.length,
  };
}

async stockLedgerReport() {
  const rows =
    await this.prisma.stockLedger.findMany({
      include: {
        item: true,
        batch: true,
        warehouse: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

  let balance = 0;

  return rows.map((row) => {
    balance +=
      Number(row.qtyIn) -
      Number(row.qtyOut);

    return {
      date: row.transactionDate,

      itemCode: row.item.itemCode,
      itemName: row.item.name,

      batchNo: row.batch.batchNo,

      warehouse:
        row.warehouse.name,

      transactionType:
        row.transactionType,

      qtyIn: Number(row.qtyIn),
      qtyOut: Number(row.qtyOut),

      balance,
    };
  });
}

async itemLedger(
  itemId: string,
) {
  const rows =
    await this.prisma.stockLedger.findMany({
      where: {
        itemId,
      },
      include: {
        item: true,
        batch: true,
        warehouse: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

  let balance = 0;

  return rows.map((row) => {
    balance +=
      Number(row.qtyIn) -
      Number(row.qtyOut);

    return {
      date: row.transactionDate,

      itemCode:
        row.item.itemCode,

      itemName:
        row.item.name,

      batchNo:
        row.batch.batchNo,

      warehouse:
        row.warehouse.name,

      transactionType:
        row.transactionType,

      qtyIn:
        Number(row.qtyIn),

      qtyOut:
        Number(row.qtyOut),

      balance,
    };
  });
}

async batchLedger(
  batchId: string,
) {
  const rows =
    await this.prisma.stockLedger.findMany({
      where: {
        batchId,
      },
      include: {
        item: true,
        batch: true,
        warehouse: true,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });

  let balance = 0;

  return rows.map((row) => {
    balance +=
      Number(row.qtyIn) -
      Number(row.qtyOut);

    return {
      date: row.transactionDate,

      itemCode:
        row.item.itemCode,

      itemName:
        row.item.name,

      batchNo:
        row.batch.batchNo,

      mrp:
        Number(row.batch.mrp),

      purchaseRate:
        Number(row.batch.purchaseRate),

      warehouse:
        row.warehouse.name,

      transactionType:
        row.transactionType,

      qtyIn:
        Number(row.qtyIn),

      qtyOut:
        Number(row.qtyOut),

      balance,
    };
  });
}

async lowStockReport() {
  const items =
    await this.prisma.item.findMany({
      where: {
        isActive: true,
      },
    });

  const result: any[] = [];

  for (const item of items) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          itemId: item.id,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const row of entries) {
      qtyIn += Number(row.qtyIn);
      qtyOut += Number(row.qtyOut);
    }

    const stock =
      qtyIn - qtyOut;

    if (stock <= 10) {
      result.push({
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        stock,
      });
    }
  }

  return result;
}

async stockValuationReport() {
  const items = await this.prisma.item.findMany({
    where: {
      isActive: true,
    },
  });

  const result: any[] = [];

  for (const item of items) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          itemId: item.id,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const row of entries) {
      qtyIn += Number(row.qtyIn);
      qtyOut += Number(row.qtyOut);
    }

    const stock = qtyIn - qtyOut;

    const purchaseRate =
      Number(item.purchaseRate);

    const stockValue =
      stock * purchaseRate;

    result.push({
      itemId: item.id,

      itemCode: item.itemCode,

      itemName: item.name,

      stock,

      purchaseRate,

      stockValue: Number(
        stockValue.toFixed(2),
      ),
    });
  }

  result.sort(
    (a, b) =>
      b.stockValue - a.stockValue,
  );

  const totalStockValue =
    result.reduce(
      (sum, x) => sum + x.stockValue,
      0,
    );

  return {
    items: result,

    totalStockValue: Number(
      totalStockValue.toFixed(2),
    ),
  };
}

async stockAgeingReport() {
  const batches =
    await this.prisma.batch.findMany({
      include: {
        item: true,
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

  const result: any[] = [];

  const today = new Date();

  for (const batch of batches) {
    const entries =
      await this.prisma.stockLedger.findMany({
        where: {
          batchId: batch.id,
        },
      });

    let qtyIn = 0;
    let qtyOut = 0;

    for (const row of entries) {
      qtyIn += Number(row.qtyIn);
      qtyOut += Number(row.qtyOut);
    }

    const stock = qtyIn - qtyOut;

    if (stock <= 0) {
      continue;
    }

    const ageDays = Math.floor(
      (today.getTime() -
        batch.createdAt.getTime()) /
        (1000 * 60 * 60 * 24),
    );

    let ageingBucket = '';

    if (ageDays <= 30) {
      ageingBucket = '0-30 Days';
    } else if (ageDays <= 60) {
      ageingBucket = '31-60 Days';
    } else if (ageDays <= 90) {
      ageingBucket = '61-90 Days';
    } else {
      ageingBucket = '90+ Days';
    }

    result.push({
      itemCode: batch.item.itemCode,
      itemName: batch.item.name,
      batchNo: batch.batchNo,

      stock,

      purchaseRate: Number(
        batch.purchaseRate,
      ),

      expiryDate: batch.expiryDate,

      purchaseDate: batch.createdAt,

      ageDays,

      ageingBucket,
    });
  }

  result.sort(
    (a, b) =>
      b.ageDays - a.ageDays,
  );

  return result;
}
}