import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateReceiptDto } from './dto/create-receipt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Injectable()
export class LedgerService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async postSales(
    customerId: string,
    amount: number,
    salesBillId: string,
  ) {
    return this.prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: 'CUSTOMER',
        partyId: customerId,

        transactionType: 'SALE',

        referenceType: 'SALE',
        referenceId: salesBillId,

        debitAmount: amount,
        creditAmount: 0,

        remarks: 'Credit Sales Bill',
      },
    });
  }

  async postSalesReturn(
  customerId: string,
  amount: number,
  saleReturnId: string,
) {
  return this.prisma.ledgerEntry.create({
    data: {
      transactionDate: new Date(),

      partyType: 'CUSTOMER',
      partyId: customerId,

      transactionType: 'SALE_RETURN',

      referenceType: 'SALE_RETURN',
      referenceId: saleReturnId,

      debitAmount: 0,
      creditAmount: amount,

      remarks: 'Sales Return',
    },
  });
}

  async postPurchase(
    supplierId: string,
    amount: number,
    purchaseBillId: string,
  ) {
    return this.prisma.ledgerEntry.create({
      data: {
        transactionDate: new Date(),

        partyType: 'SUPPLIER',
        partyId: supplierId,

        transactionType: 'PURCHASE',

        referenceType: 'PURCHASE',
        referenceId: purchaseBillId,

        debitAmount: 0,
        creditAmount: amount,

        remarks: 'Purchase Bill',
      },
    });
  }

  async postPurchaseReturn(
  supplierId: string,
  amount: number,
  purchaseReturnId: string,
) {
  return this.prisma.ledgerEntry.create({
    data: {
      transactionDate: new Date(),

      partyType: 'SUPPLIER',
      partyId: supplierId,

      transactionType: 'PURCHASE_RETURN',

      referenceType: 'PURCHASE_RETURN',
      referenceId: purchaseReturnId,

      debitAmount: amount,
      creditAmount: 0,

      remarks: 'Purchase Return',
    },
  });
}

  async createReceipt(
    dto: CreateReceiptDto,
  ) {
    return this.prisma.ledgerEntry.create({
      data: {
        transactionDate: dto.receiptDate,

        partyType: 'CUSTOMER',
        partyId: dto.customerId,

        transactionType: 'RECEIPT',

        debitAmount: 0,
        creditAmount: dto.amount,

        remarks: dto.remarks,
      },
    });
  }

  async createPayment(
    dto: CreatePaymentDto,
  ) {
    return this.prisma.ledgerEntry.create({
      data: {
        transactionDate: dto.paymentDate,

        partyType: 'SUPPLIER',
        partyId: dto.supplierId,

        transactionType: 'PAYMENT',

        debitAmount: dto.amount,
        creditAmount: 0,

        remarks: dto.remarks,
      },
    });
  }

  async customerLedger(
    customerId: string,
  ) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        partyType: 'CUSTOMER',
        partyId: customerId,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });
  }

  async supplierLedger(
    supplierId: string,
  ) {
    return this.prisma.ledgerEntry.findMany({
      where: {
        partyType: 'SUPPLIER',
        partyId: supplierId,
      },
      orderBy: {
        transactionDate: 'asc',
      },
    });
  }

  async customerOutstanding(
    customerId: string,
  ) {
    const rows =
      await this.customerLedger(customerId);

    let debit = 0;
    let credit = 0;

    for (const row of rows) {
      debit += Number(row.debitAmount);
      credit += Number(row.creditAmount);
    }

    return {
      outstanding: debit - credit,
    };
  }

  async supplierOutstanding(
    supplierId: string,
  ) {
    const rows =
      await this.supplierLedger(supplierId);

    let debit = 0;
    let credit = 0;

    for (const row of rows) {
      debit += Number(row.debitAmount);
      credit += Number(row.creditAmount);
    }

    return {
      outstanding: credit - debit,
    };
  }
}