import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

import { CreateSaleReturnDto } from './dto/create-sale-return.dto';

@Injectable()
export class SaleReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async create(
    dto: CreateSaleReturnDto,
  ) {
    let grossAmount = 0;
    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let netAmount = 0;

    for (const item of dto.items) {
      const gross = item.qty * item.saleRate;

      const tax =
        gross *
        item.gstPercent /
        100;

      const cgst = tax / 2;
      const sgst = tax / 2;

      grossAmount += gross;
      taxableAmount += gross;

      totalCgst += cgst;
      totalSgst += sgst;

      netAmount += gross + tax;
    }

    const saleReturn =
      await this.prisma.saleReturn.create({
        data: {
          returnNo: dto.returnNo,
          returnDate: dto.returnDate,

          salesBillId: dto.salesBillId,

          customerId: dto.customerId,

          warehouseId: dto.warehouseId,

          grossAmount,
          taxableAmount,

          cgstAmount: totalCgst,
          sgstAmount: totalSgst,
          igstAmount: totalIgst,

          netAmount,
        },
      });

    for (const item of dto.items) {
      const gross =
        item.qty *
        item.saleRate;

      const tax =
        gross *
        item.gstPercent /
        100;

      const cgst = tax / 2;
      const sgst = tax / 2;

      await this.prisma.saleReturnItem.create({
        data: {
          saleReturnId: saleReturn.id,

          itemId: item.itemId,
          batchId: item.batchId,

          qty: item.qty,

          saleRate: item.saleRate,

          gstPercent: item.gstPercent,

          taxableAmount: gross,

          cgstAmount: cgst,
          sgstAmount: sgst,
          igstAmount: 0,

          netAmount: gross + tax,
        },
      });

      await this.prisma.stockLedger.create({
        data: {
          transactionDate: new Date(),

          transactionType: 'SALE_RETURN',

          itemId: item.itemId,
          batchId: item.batchId,
          warehouseId: dto.warehouseId,

          qtyIn: item.qty,
          qtyOut: 0,

          referenceType: 'SALE_RETURN',
          referenceId: saleReturn.id,

          remarks: 'Sale Return',
        },
      });
    }

    if (dto.customerId) {
      await this.ledgerService.postSalesReturn(
        dto.customerId,
        netAmount,
        saleReturn.id,
      );
    }

    return saleReturn;
  }

  async findAll() {
    return this.prisma.saleReturn.findMany({
      include: {
        customer: true,
        warehouse: true,
        salesBill: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.saleReturn.findUnique({
      where: { id },

      include: {
        customer: true,
        warehouse: true,
        salesBill: true,
        items: true,
      },
    });
  }
}