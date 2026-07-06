import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';

import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';

@Injectable()
export class PurchaseReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
  ) {}

  async create(
    dto: CreatePurchaseReturnDto,
  ) {
    let grossAmount = 0;
    let taxableAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;
    let netAmount = 0;

    for (const item of dto.items) {
      const gross =
        item.qty *
        item.purchaseRate;

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

    const purchaseReturn =
      await this.prisma.purchaseReturn.create({
        data: {
          returnNo: dto.returnNo,
          returnDate: dto.returnDate,

          purchaseBillId: dto.purchaseBillId,

          supplierId: dto.supplierId,

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
        item.purchaseRate;

      const tax =
        gross *
        item.gstPercent /
        100;

      const cgst = tax / 2;
      const sgst = tax / 2;

      await this.prisma.purchaseReturnItem.create({
        data: {
          purchaseReturnId: purchaseReturn.id,

          itemId: item.itemId,
          batchId: item.batchId,

          qty: item.qty,

          purchaseRate: item.purchaseRate,

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

          transactionType: 'PURCHASE_RETURN',

          itemId: item.itemId,
          batchId: item.batchId,
          warehouseId: dto.warehouseId,

          qtyIn: 0,
          qtyOut: item.qty,

          referenceType: 'PURCHASE_RETURN',
          referenceId: purchaseReturn.id,

          remarks: 'Purchase Return',
        },
      });
    }

    await this.ledgerService.postPurchaseReturn(
      dto.supplierId,
      netAmount,
      purchaseReturn.id,
    );

    return purchaseReturn;
  }

  async findAll() {
    return this.prisma.purchaseReturn.findMany({
      include: {
        supplier: true,
        warehouse: true,
        purchaseBill: true,
        items: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.purchaseReturn.findUnique({
      where: {
        id,
      },
      include: {
        supplier: true,
        warehouse: true,
        purchaseBill: true,
        items: true,
      },
    });
  }
}