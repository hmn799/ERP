import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { CreateReceiptDto } from "./dto/create-receipt.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";
import { FinancialYearGuardService } from "../financial-year/financial-year-guard.service";

// Synthetic, non-Customer/Supplier parties for ledger rows that don't
// belong to a real party - partyId/partyType carry no foreign key, so
// these are just fixed strings the reports layer recognizes by name.
export const HOUSE_CASH_SALE_PARTY_ID = "HOUSE_CASH_SALE";
export const HOUSE_SHORT_EXCESS_PARTY_ID = "HOUSE_SHORT_EXCESS";
export const HOUSE_PETTY_EXPENSE_PARTY_ID = "HOUSE_PETTY_EXPENSE";

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly financialYearGuardService: FinancialYearGuardService,
  ) {}

  // =========================================================
  // SALES
  // =========================================================

  async postSales(
    customerId: string,
    amount: number,
    salesBillId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "CUSTOMER",
        partyId: customerId,

        transactionType: "SALE",

        referenceType: "SALE",
        referenceId: salesBillId,

        debitAmount: amount,
        creditAmount: 0,

        remarks: "Credit Sales Bill",
      },
    });
  }

  // =========================================================
  // SALE - CASH/UPI/CARD SETTLEMENT (paired debit)
  //
  // Only used alongside postSaleReceipt() below, when the sale is
  // tied to a real customer, so the immediate cash/upi/card portion
  // nets to zero on the customer's outstanding balance - it was
  // never a receivable, so it must not linger as one.
  // =========================================================

  async postSaleSettlementDebit(
    customerId: string,
    amount: number,
    salesBillId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "CUSTOMER",
        partyId: customerId,

        transactionType: "SALE_SETTLED",

        referenceType: "SALES_BILL",
        referenceId: salesBillId,

        debitAmount: amount,
        creditAmount: 0,

        remarks: "Cash/UPI/Card Sale (settled immediately)",
      },
    });
  }

  // =========================================================
  // SALE - CASH/UPI/CARD RECEIPT
  //
  // The money-in leg for a payment collected at the time of sale.
  // paymentMode drives Cash Book / Card Book / UPI Book filtering.
  // Posted against the customer (paired with the debit above) when
  // one is on the bill, otherwise against the HOUSE walk-in party.
  // =========================================================

  async postSaleReceipt(
    partyType: "CUSTOMER" | "HOUSE",
    partyId: string,
    paymentMode: string,
    amount: number,
    salesBillId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType,
        partyId,

        transactionType: "RECEIPT",

        referenceType: "SALES_BILL",
        referenceId: salesBillId,

        debitAmount: 0,
        creditAmount: amount,

        paymentMode,

        remarks: `${paymentMode} Sale Receipt`,
      },
    });
  }

  // =========================================================
  // SHORT AMOUNT - HOUSE WRITE-OFF
  //
  // Purely internal bookkeeping - never posted against the
  // customer, who was never charged this and doesn't owe it.
  // Lets Day Book show the total short amounts absorbed.
  // =========================================================

  async postShortAndExcess(
    amount: number,
    salesBillId: string,
    billNo: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "HOUSE",
        partyId: HOUSE_SHORT_EXCESS_PARTY_ID,

        transactionType: "SHORT_AND_EXCESS",

        referenceType: "SALES_BILL",
        referenceId: salesBillId,

        debitAmount: amount,
        creditAmount: 0,

        remarks: `Short amount on Bill ${billNo}`,
      },
    });
  }

  // =========================================================
  // SALES RETURN
  // =========================================================

  async postSalesReturn(
    customerId: string,
    amount: number,
    saleReturnId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "CUSTOMER",
        partyId: customerId,

        transactionType: "SALE_RETURN",

        referenceType: "SALE_RETURN",
        referenceId: saleReturnId,

        debitAmount: 0,
        creditAmount: amount,

        remarks: "Sales Return",
      },
    });
  }

  // =========================================================
  // PURCHASE
  // =========================================================

  async postPurchase(
    supplierId: string,
    amount: number,
    purchaseBillId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "SUPPLIER",
        partyId: supplierId,

        transactionType: "PURCHASE",

        referenceType: "PURCHASE",
        referenceId: purchaseBillId,

        debitAmount: 0,
        creditAmount: amount,

        remarks: "Purchase Bill",
      },
    });
  }

  // =========================================================
  // PURCHASE RETURN
  // =========================================================

  async postPurchaseReturn(
    supplierId: string,
    amount: number,
    purchaseReturnId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "SUPPLIER",
        partyId: supplierId,

        transactionType: "PURCHASE_RETURN",

        referenceType: "PURCHASE_RETURN",
        referenceId: purchaseReturnId,

        debitAmount: amount,
        creditAmount: 0,

        remarks: "Purchase Return",
      },
    });
  }

  // =========================================================
  // PETTY EXPENSE
  //
  // Posted as a PAYMENT against the synthetic HOUSE party (no real
  // supplier involved) purely so it flows straight into Cash Book
  // / Card Book / UPI Book alongside every other PAYMENT, with no
  // changes needed to those reports.
  // =========================================================

  async postPettyExpense(
    amount: number,
    paymentMode: string,
    pettyExpenseId: string,
    remarks: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "HOUSE",
        partyId: HOUSE_PETTY_EXPENSE_PARTY_ID,

        transactionType: "PAYMENT",

        referenceType: "PETTY_EXPENSE",
        referenceId: pettyExpenseId,

        debitAmount: amount,
        creditAmount: 0,

        remarks,

        paymentMode,
      },
    });
  }

  // =========================================================
  // DEBIT NOTE (standalone adjustment against a supplier -
  // reduces what we owe them, same sign as PURCHASE_RETURN)
  // =========================================================

  async postDebitNote(
    supplierId: string,
    amount: number,
    adjustmentNoteId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "SUPPLIER",
        partyId: supplierId,

        transactionType: "DEBIT_NOTE",

        referenceType: "ADJUSTMENT_NOTE",
        referenceId: adjustmentNoteId,

        debitAmount: amount,
        creditAmount: 0,

        remarks: "Debit Note",
      },
    });
  }

  // =========================================================
  // CREDIT NOTE (standalone adjustment against a customer -
  // reduces what they owe us, same sign as RECEIPT)
  // =========================================================

  async postCreditNote(
    customerId: string,
    amount: number,
    adjustmentNoteId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: "CUSTOMER",
        partyId: customerId,

        transactionType: "CREDIT_NOTE",

        referenceType: "ADJUSTMENT_NOTE",
        referenceId: adjustmentNoteId,

        debitAmount: 0,
        creditAmount: amount,

        remarks: "Credit Note",
      },
    });
  }

  /*
   * Opposite-signed reversal for cancelling a debit/credit note -
   * the original entry is kept (audit trail), this nets it out.
   */
  async reverseAdjustmentNote(
    partyType: "SUPPLIER" | "CUSTOMER",
    partyId: string,
    amount: number,
    adjustmentNoteId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    const isDebit = partyType === "SUPPLIER";

    return prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType,
        partyId,

        transactionType: isDebit
          ? "DEBIT_NOTE_CANCELLED"
          : "CREDIT_NOTE_CANCELLED",

        referenceType: "ADJUSTMENT_NOTE",
        referenceId: adjustmentNoteId,

        debitAmount: isDebit ? 0 : amount,
        creditAmount: isDebit ? amount : 0,

        remarks: isDebit
          ? "Debit Note Cancelled"
          : "Credit Note Cancelled",
      },
    });
  }

  // =========================================================
  // RECEIPT
  // =========================================================

  async createReceipt(
    dto: CreateReceiptDto,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    await this.financialYearGuardService.assertDateNotClosed(
      dto.receiptDate,
    );

    const customer = await prisma.customer.findUnique({
      where: { id: dto.customerId },
    });

    if (!customer) {
      throw new BadRequestException(
        "Invalid customer.",
      );
    }

    return prisma.ledgerEntry.create({
      data: {
        transactionDate: dto.receiptDate,

        partyType: "CUSTOMER",
        partyId: dto.customerId,

        transactionType: "RECEIPT",

        referenceType: dto.salesBillId
          ? "SALES_BILL"
          : undefined,
        referenceId: dto.salesBillId,

        debitAmount: 0,
        creditAmount: dto.amount,

        remarks: dto.remarks,

        bankAccountId: dto.bankAccountId,
      },
    });
  }

  // =========================================================
  // PAYMENT
  // =========================================================

  async createPayment(
    dto: CreatePaymentDto,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    await this.financialYearGuardService.assertDateNotClosed(
      dto.paymentDate,
    );

    const supplier = await prisma.supplier.findUnique({
      where: { id: dto.supplierId },
    });

    if (!supplier) {
      throw new BadRequestException(
        "Invalid supplier.",
      );
    }

    return prisma.ledgerEntry.create({
      data: {
        transactionDate: dto.paymentDate,

        partyType: "SUPPLIER",
        partyId: dto.supplierId,

        transactionType: "PAYMENT",

        referenceType: dto.purchaseBillId
          ? "PURCHASE_BILL"
          : undefined,
        referenceId: dto.purchaseBillId,

        debitAmount: dto.amount,
        creditAmount: 0,

        remarks: dto.remarks,

        bankAccountId: dto.bankAccountId,
      },
    });
  }

  // =========================================================
  // LIST RECEIPTS
  // =========================================================

  async listReceipts() {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { transactionType: "RECEIPT" },
      orderBy: { transactionDate: "desc" },
    });

    const customers = await this.prisma.customer.findMany({
      where: {
        id: { in: rows.map((row) => row.partyId) },
      },
      select: { id: true, name: true, customerCode: true },
    });

    const customerMap = new Map(
      customers.map((customer) => [customer.id, customer]),
    );

    const billIds = rows
      .filter(
        (row) => row.referenceType === "SALES_BILL",
      )
      .map((row) => row.referenceId as string);

    const bills =
      billIds.length > 0
        ? await this.prisma.salesBill.findMany({
            where: { id: { in: billIds } },
            select: { id: true, billNo: true },
          })
        : [];

    const billMap = new Map(
      bills.map((bill) => [bill.id, bill.billNo]),
    );

    return rows.map((row) => ({
      id: row.id,
      date: row.transactionDate,
      customerId: row.partyId,
      customerName:
        customerMap.get(row.partyId)?.name ??
        "Unknown customer",
      customerCode:
        customerMap.get(row.partyId)?.customerCode ?? "",
      amount: Number(row.creditAmount),
      remarks: row.remarks,
      bankAccountId: row.bankAccountId,
      billNo:
        row.referenceType === "SALES_BILL"
          ? (billMap.get(row.referenceId as string) ??
            null)
          : null,
    }));
  }

  // =========================================================
  // LIST PAYMENTS
  // =========================================================

  async listPayments() {
    const rows = await this.prisma.ledgerEntry.findMany({
      where: { transactionType: "PAYMENT" },
      orderBy: { transactionDate: "desc" },
    });

    const suppliers = await this.prisma.supplier.findMany({
      where: {
        id: { in: rows.map((row) => row.partyId) },
      },
      select: { id: true, name: true, supplierCode: true },
    });

    const supplierMap = new Map(
      suppliers.map((supplier) => [supplier.id, supplier]),
    );

    const billIds = rows
      .filter(
        (row) => row.referenceType === "PURCHASE_BILL",
      )
      .map((row) => row.referenceId as string);

    const bills =
      billIds.length > 0
        ? await this.prisma.purchaseBill.findMany({
            where: { id: { in: billIds } },
            select: { id: true, billNo: true },
          })
        : [];

    const billMap = new Map(
      bills.map((bill) => [bill.id, bill.billNo]),
    );

    return rows.map((row) => ({
      id: row.id,
      date: row.transactionDate,
      supplierId: row.partyId,
      supplierName:
        supplierMap.get(row.partyId)?.name ??
        "Unknown supplier",
      supplierCode:
        supplierMap.get(row.partyId)?.supplierCode ?? "",
      amount: Number(row.debitAmount),
      remarks: row.remarks,
      bankAccountId: row.bankAccountId,
      billNo:
        row.referenceType === "PURCHASE_BILL"
          ? (billMap.get(row.referenceId as string) ??
            null)
          : null,
    }));
  }

  // =========================================================
  // CUSTOMER LEDGER
  // =========================================================

  async customerLedger(
    customerId: string,
  ) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        partyType: "CUSTOMER",
        partyId: customerId,
      },

      orderBy: {
        transactionDate: "asc",
      },
    });
  }

  // =========================================================
  // SUPPLIER LEDGER
  // =========================================================

  async supplierLedger(
    supplierId: string,
  ) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        partyType: "SUPPLIER",
        partyId: supplierId,
      },

      orderBy: {
        transactionDate: "asc",
      },
    });
  }

  // =========================================================
  // CUSTOMER OUTSTANDING
  // =========================================================

  async customerOutstanding(
    customerId: string,
  ) {
    const rows =
      await this.customerLedger(
        customerId,
      );

    let debit = 0;
    let credit = 0;

    for (const row of rows) {
      debit += Number(
        row.debitAmount,
      );

      credit += Number(
        row.creditAmount,
      );
    }

    return {
      outstanding:
        debit - credit,
    };
  }

  // =========================================================
  // SUPPLIER OUTSTANDING
  // =========================================================

  async supplierOutstanding(
    supplierId: string,
  ) {
    const rows =
      await this.supplierLedger(
        supplierId,
      );

    let debit = 0;
    let credit = 0;

    for (const row of rows) {
      debit += Number(
        row.debitAmount,
      );

      credit += Number(
        row.creditAmount,
      );
    }

    return {
      outstanding:
        credit - debit,
    };
  }
}