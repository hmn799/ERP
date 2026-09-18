import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from '../settings/settings.service';

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settingsService: SettingsService,
  ) {}

  /*
   * =====================================================
   * CUSTOMER BILLING DASHBOARD
   *
   * Backs the party dashboard shown in the billing
   * screen: total sales, top items bought, and purchase
   * history (oldest first), scoped to one customer.
   * =====================================================
   */

  async customerBillingSummary(
    customerId: string,
  ) {
    const bills =
      await this.prisma.salesBill.findMany({
        where: { customerId },
        include: {
          items: {
            include: { item: true },
          },
        },
        orderBy: { billDate: 'asc' },
      });

    let totalSales = 0;

    const itemMap = new Map<
      string,
      {
        itemId: string;
        itemCode: string;
        itemName: string;
        qty: number;
        value: number;
      }
    >();

    for (const bill of bills) {
      totalSales += Number(bill.netAmount);

      for (const line of bill.items) {
        const existing = itemMap.get(
          line.itemId,
        );

        if (existing) {
          existing.qty += Number(line.qty);
          existing.value += Number(
            line.netAmount,
          );
        } else {
          itemMap.set(line.itemId, {
            itemId: line.itemId,
            itemCode: line.item.itemCode,
            itemName: line.item.name,
            qty: Number(line.qty),
            value: Number(line.netAmount),
          });
        }
      }
    }

    const topItems = Array.from(
      itemMap.values(),
    )
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((row) => ({
        ...row,
        qty: Number(row.qty.toFixed(2)),
        value: Number(row.value.toFixed(2)),
      }));

    const purchaseHistory = bills.map(
      (bill) => ({
        id: bill.id,
        billNo: bill.billNo,
        billDate: bill.billDate,
        netAmount: Number(bill.netAmount),
        itemCount: bill.items.length,
      }),
    );

    return {
      totalSales: Number(
        totalSales.toFixed(2),
      ),
      billCount: bills.length,
      topItems,
      purchaseHistory,
    };
  }

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

    /*
     * CASH BOOK - cash-in-hand movements only. RECEIPT/PAYMENT
     * ledger entries collected into or paid out of a bank account
     * carry a bankAccountId (see the LedgerEntry.bankAccountId
     * comment in schema.prisma) - excluding those here is what
     * makes this a cash book rather than a combined cash+bank book
     * (that's bankBook() below, and dayBook() above for everything
     * unfiltered).
     */
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

        bankAccountId: null,

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

  const partyNames =
    await this.resolvePartyNames(rows);

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
      partyName:
        partyNames.get(row.partyId) ??
        'Unknown',
      type: row.transactionType,
      receipt,
      payment,
      balance,
      remarks: row.remarks,
    };
  });
}

    /*
     * BANK BOOK - the flip side of cashBook(): every RECEIPT/
     * PAYMENT that moved through one specific bank account, with a
     * running balance for that account.
     */
    async bankBook(
  bankAccountId: string,
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

        bankAccountId,

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

  const partyNames =
    await this.resolvePartyNames(rows);

  let balance = 0;

  return rows.map((row) => {
    const deposit =
      Number(row.creditAmount);

    const withdrawal =
      Number(row.debitAmount);

    balance += deposit - withdrawal;

    return {
      date: row.transactionDate,
      partyType: row.partyType,
      partyId: row.partyId,
      partyName:
        partyNames.get(row.partyId) ??
        'Unknown',
      type: row.transactionType,
      deposit,
      withdrawal,
      balance,
      remarks: row.remarks,
    };
  });
}

    /*
     * Shared by cashBook/bankBook - a ledger row's partyId is a
     * Customer id (partyType "CUSTOMER") or Supplier id
     * ("SUPPLIER"); look both up in one pass per book rather than
     * per row.
     */
    private async resolvePartyNames(
  rows: { partyType: string; partyId: string }[],
) {
  const customerIds = rows
    .filter((row) => row.partyType === 'CUSTOMER')
    .map((row) => row.partyId);

  const supplierIds = rows
    .filter((row) => row.partyType === 'SUPPLIER')
    .map((row) => row.partyId);

  const [customers, suppliers] = await Promise.all([
    customerIds.length > 0
      ? this.prisma.customer.findMany({
          where: { id: { in: customerIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),

    supplierIds.length > 0
      ? this.prisma.supplier.findMany({
          where: { id: { in: supplierIds } },
          select: { id: true, name: true },
        })
      : Promise.resolve([]),
  ]);

  const map = new Map<string, string>();

  for (const customer of customers) {
    map.set(customer.id, customer.name);
  }

  for (const supplier of suppliers) {
    map.set(supplier.id, supplier.name);
  }

  return map;
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

/*
 * =====================================================
 * SALES TREND
 *
 * Net sales grouped by calendar day for the last `days`
 * days, including days with zero sales, oldest first -
 * backs the dashboard sales chart.
 * =====================================================
 */

async salesTrend(days: number) {
  const safeDays =
    Number.isFinite(days) && days > 0
      ? Math.min(days, 90)
      : 14;

  // Anchor to UTC midnight (not local midnight) so day
  // keys line up with billDate.toISOString().slice(0, 10).
  const todayUtc = new Date(
    `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
  );

  const since = new Date(todayUtc);
  since.setUTCDate(
    since.getUTCDate() - (safeDays - 1),
  );

  const bills =
    await this.prisma.salesBill.findMany({
      where: {
        billDate: { gte: since },
      },
      select: {
        billDate: true,
        netAmount: true,
      },
    });

  const totalsByDay = new Map<string, number>();

  for (const bill of bills) {
    const key = bill.billDate
      .toISOString()
      .slice(0, 10);

    totalsByDay.set(
      key,
      (totalsByDay.get(key) ?? 0) +
        Number(bill.netAmount),
    );
  }

  const result: { date: string; sales: number }[] =
    [];

  for (let i = 0; i < safeDays; i++) {
    const day = new Date(since);
    day.setUTCDate(day.getUTCDate() + i);

    const key = day.toISOString().slice(0, 10);

    result.push({
      date: key,
      sales: Number(
        (totalsByDay.get(key) ?? 0).toFixed(2),
      ),
    });
  }

  return result;
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

/*
 * =====================================================
 * GSTR-1 / GSTR-3B (filing-aid reports)
 *
 * These produce correctly-shaped, period-based GST return
 * data from existing sales/purchase records so a business
 * user or accountant can prepare a filing - they do not
 * submit anything to the GSTN portal.
 * =====================================================
 */

private monthRange(month?: string) {
  const now = new Date();

  const defaultMonth = `${now.getFullYear()}-${String(
    now.getMonth() + 1,
  ).padStart(2, '0')}`;

  const [yearStr, monthStr] = (
    month || defaultMonth
  ).split('-');

  const year = Number(yearStr);
  const monthIndex = Number(monthStr) - 1;

  const start = new Date(
    Date.UTC(year, monthIndex, 1, 0, 0, 0),
  );

  const end = new Date(
    Date.UTC(year, monthIndex + 1, 0, 23, 59, 59, 999),
  );

  return {
    start,
    end,
    period: `${yearStr}-${monthStr}`,
  };
}

private async companyGstProfile() {
  const notes: string[] = [];

  let gstin: string | null = null;
  let legalName: string | null = null;

  try {
    gstin = await this.settingsService.getString(
      'company.gstin',
    );
  } catch {
    notes.push(
      'Company GSTIN is not configured (Settings > company.gstin) - add it before filing.',
    );
  }

  try {
    legalName = await this.settingsService.getString(
      'company.legalName',
    );
  } catch {
    notes.push(
      'Company legal name is not configured (Settings > company.legalName).',
    );
  }

  return { gstin, legalName, notes };
}

async gstr1(month?: string) {
  const { start, end, period } =
    this.monthRange(month);

  const company = await this.companyGstProfile();

  const bills = await this.prisma.salesBill.findMany({
    where: {
      billDate: { gte: start, lte: end },
    },
    include: {
      customer: true,
      items: { include: { item: true } },
    },
    orderBy: { billDate: 'asc' },
  });

  const round2 = (value: number) =>
    Number((value || 0).toFixed(2));

  const b2b: any[] = [];
  const b2cLarge: any[] = [];
  const b2csMap = new Map<string, any>();
  const hsnMap = new Map<string, any>();

  let totalTaxableValue = 0;
  let totalInvoiceValue = 0;
  let totalTax = 0;

  for (const bill of bills) {
    const gstin = bill.customer?.gstin?.trim();
    const isB2B = !!gstin;

    const placeOfSupply =
      bill.customer?.state?.trim() || 'UNKNOWN';

    const invoiceValue = Number(bill.netAmount);
    const taxableValue = Number(bill.taxableAmount);
    const cgst = Number(bill.cgstAmount);
    const sgst = Number(bill.sgstAmount);
    const igst = Number(bill.igstAmount);
    const isInterState = igst > 0;

    totalTaxableValue += taxableValue;
    totalInvoiceValue += invoiceValue;
    totalTax += cgst + sgst + igst;

    if (isB2B) {
      b2b.push({
        billNo: bill.billNo,
        billDate: bill.billDate,
        customerName: bill.customer!.name,
        gstin,
        placeOfSupply,
        invoiceValue: round2(invoiceValue),
        taxableValue: round2(taxableValue),
        cgst: round2(cgst),
        sgst: round2(sgst),
        igst: round2(igst),
      });
    } else if (
      isInterState &&
      invoiceValue > 250000
    ) {
      b2cLarge.push({
        billNo: bill.billNo,
        billDate: bill.billDate,
        placeOfSupply,
        invoiceValue: round2(invoiceValue),
        taxableValue: round2(taxableValue),
        igst: round2(igst),
      });
    } else {
      for (const line of bill.items) {
        const ratePercent = Number(line.gstPercent);
        const key = `${placeOfSupply}|${ratePercent}`;

        if (!b2csMap.has(key)) {
          b2csMap.set(key, {
            placeOfSupply,
            ratePercent,
            taxableValue: 0,
            cgst: 0,
            sgst: 0,
            igst: 0,
          });
        }

        const bucket = b2csMap.get(key);
        bucket.taxableValue += Number(
          line.taxableAmount,
        );
        bucket.cgst += Number(line.cgstAmount);
        bucket.sgst += Number(line.sgstAmount);
        bucket.igst += Number(line.igstAmount);
      }
    }

    for (const line of bill.items) {
      const hsn =
        line.item.hsnCode?.trim() || 'UNSPECIFIED';

      if (!hsnMap.has(hsn)) {
        hsnMap.set(hsn, {
          hsnCode: hsn,
          qty: 0,
          taxableValue: 0,
          cgst: 0,
          sgst: 0,
          igst: 0,
        });
      }

      const bucket = hsnMap.get(hsn);
      bucket.qty += Number(line.qty);
      bucket.taxableValue += Number(
        line.taxableAmount,
      );
      bucket.cgst += Number(line.cgstAmount);
      bucket.sgst += Number(line.sgstAmount);
      bucket.igst += Number(line.igstAmount);
    }
  }

  return {
    period,
    company: {
      gstin: company.gstin,
      legalName: company.legalName,
    },
    summary: {
      totalInvoices: bills.length,
      totalTaxableValue: round2(totalTaxableValue),
      totalTax: round2(totalTax),
      totalInvoiceValue: round2(totalInvoiceValue),
    },
    b2b,
    b2cLarge,
    b2cSmall: Array.from(b2csMap.values()).map(
      (row) => ({
        ...row,
        taxableValue: round2(row.taxableValue),
        cgst: round2(row.cgst),
        sgst: round2(row.sgst),
        igst: round2(row.igst),
      }),
    ),
    hsnSummary: Array.from(hsnMap.values()).map(
      (row) => ({
        ...row,
        qty: round2(row.qty),
        taxableValue: round2(row.taxableValue),
        cgst: round2(row.cgst),
        sgst: round2(row.sgst),
        igst: round2(row.igst),
      }),
    ),
    notes: [
      ...company.notes,
      'B2C (Large) requires an inter-state invoice over ₹2,50,000. This billing engine currently always computes CGST+SGST (IGST is not yet supported for sales), so this section will stay empty until inter-state billing is implemented.',
      'Nil-rated, exempt, and export supplies are not tracked separately and are not included in this return.',
      'HSN codes are optional on items in this system - lines from items without one are grouped under "UNSPECIFIED".',
    ],
  };
}

async gstr3b(month?: string) {
  const { start, end, period } =
    this.monthRange(month);

  const company = await this.companyGstProfile();

  const [salesAgg, purchaseAgg] = await Promise.all([
    this.prisma.salesBillItem.aggregate({
      where: {
        salesBill: {
          billDate: { gte: start, lte: end },
        },
      },
      _sum: {
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
      },
    }),

    this.prisma.purchaseBillItem.aggregate({
      where: {
        purchaseBill: {
          billDate: { gte: start, lte: end },
          status: 'ACTIVE',
        },
      },
      _sum: {
        taxableAmount: true,
        cgstAmount: true,
        sgstAmount: true,
        igstAmount: true,
      },
    }),
  ]);

  const round2 = (value: number) =>
    Number((value || 0).toFixed(2));

  const outwardTaxable = Number(
    salesAgg._sum.taxableAmount || 0,
  );
  const outwardCgst = Number(
    salesAgg._sum.cgstAmount || 0,
  );
  const outwardSgst = Number(
    salesAgg._sum.sgstAmount || 0,
  );
  const outwardIgst = Number(
    salesAgg._sum.igstAmount || 0,
  );

  const itcTaxable = Number(
    purchaseAgg._sum.taxableAmount || 0,
  );
  const itcCgst = Number(
    purchaseAgg._sum.cgstAmount || 0,
  );
  const itcSgst = Number(
    purchaseAgg._sum.sgstAmount || 0,
  );
  const itcIgst = Number(
    purchaseAgg._sum.igstAmount || 0,
  );

  const netCgst = outwardCgst - itcCgst;
  const netSgst = outwardSgst - itcSgst;
  const netIgst = outwardIgst - itcIgst;

  return {
    period,
    company: {
      gstin: company.gstin,
      legalName: company.legalName,
    },
    section3_1OutwardSupplies: {
      taxableOutwardSupplies: {
        taxableValue: round2(outwardTaxable),
        igst: round2(outwardIgst),
        cgst: round2(outwardCgst),
        sgst: round2(outwardSgst),
      },
      zeroRatedSupplies: { taxableValue: 0, igst: 0 },
      otherOutwardSupplies: { taxableValue: 0 },
      inwardSuppliesReverseCharge: {
        taxableValue: 0,
        igst: 0,
        cgst: 0,
        sgst: 0,
      },
      nonGstOutwardSupplies: { taxableValue: 0 },
    },
    section4EligibleItc: {
      allOtherItc: {
        taxableValue: round2(itcTaxable),
        igst: round2(itcIgst),
        cgst: round2(itcCgst),
        sgst: round2(itcSgst),
      },
      itcReversed: { igst: 0, cgst: 0, sgst: 0 },
      netEligibleItc: {
        igst: round2(itcIgst),
        cgst: round2(itcCgst),
        sgst: round2(itcSgst),
      },
    },
    section6_1TaxPayable: {
      igst: round2(Math.max(0, netIgst)),
      cgst: round2(Math.max(0, netCgst)),
      sgst: round2(Math.max(0, netSgst)),
    },
    notes: [
      ...company.notes,
      'Zero-rated (export) supplies, nil-rated/exempt supplies, reverse-charge inward supplies, and ITC reversal are not tracked in this system and are reported as zero.',
      'Tax payable is a simple output-minus-ITC calculation for the period - it does not account for any electronic cash/credit ledger balance carried from a prior period.',
    ],
  };
}
}