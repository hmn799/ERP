import {
  BadRequestException,
  Injectable,
} from "@nestjs/common";

import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";

import { CreateReceiptDto } from "./dto/create-receipt.dto";
import { CreatePaymentDto } from "./dto/create-payment.dto";

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
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
  // RECEIPT
  // =========================================================

  async createReceipt(
    dto: CreateReceiptDto,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
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