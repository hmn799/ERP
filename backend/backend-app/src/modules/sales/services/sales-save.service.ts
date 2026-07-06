import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { CreateSalesDto } from '../dto/create-sales.dto';

import { SalesStockService } from './sales-stock.service';
import { SalesGstService } from './sales-gst.service';
import { LedgerService } from '../../ledger/ledger.service';

@Injectable()
export class SalesSaveService {
  constructor(
    private prisma: PrismaService,
    private stockService: SalesStockService,
    private gstService: SalesGstService,
    private ledgerService: LedgerService,
  ) {}

  async saveSales(dto: CreateSalesDto) {
    let grossAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const customer = dto.customerId
      ? await this.prisma.customer.findUnique({
          where: {
            id: dto.customerId,
          },
        })
      : null;

    const itemCalculations: any[] = [];

    for (const item of dto.items) {
      const batch =
        await this.prisma.batch.findUnique({
          where: {
            id: item.batchId,
          },
          include: {
            item: {
              include: {
                gstSlab: true,
              },
            },
          },
        });

      if (!batch) {
        throw new Error('Batch not found');
      }

      let saleRate = 0;

      switch (
        customer?.priceLevel?.toUpperCase()
      ) {
        case 'WHOLESALE':
          saleRate = Number(batch.wholesaleRate);
          break;

        case 'DISTRIBUTOR':
          saleRate = Number(batch.distributorRate);
          break;

        default:
          saleRate = Number(batch.retailRate);
      }

      const currentStock =
        await this.stockService.getCurrentStock(
          item.itemId,
          item.batchId,
          dto.warehouseId,
        );

      if (currentStock < item.qty) {
        console.warn(
          `Negative stock warning: Available=${currentStock}, Requested=${item.qty}`,
        );
      }

      const gstPercent =
        Number(
          batch.item.gstSlab.percentage,
        );

      const calc =
        this.gstService.calculateItem(
          item.qty,
          saleRate,
          item.discountPercent,
          gstPercent,
        );

      grossAmount += calc.grossAmount;
      totalCgst += calc.cgstAmount;
      totalSgst += calc.sgstAmount;
      totalIgst += calc.igstAmount;

      itemCalculations.push({
        item,
        batch,
        saleRate,
        gstPercent,
        calc,
      });
    }

    const billCalc =
      this.gstService.calculateBill(
        grossAmount,
        dto.billDiscountPercent || 0,
        totalCgst,
        totalSgst,
        totalIgst,
      );

    const salesBill =
      await this.prisma.salesBill.create({
        
       data: {
  billNo: dto.billNo,

  billDate: dto.billDate,

  customerId: dto.customerId || null,

  warehouseId: dto.warehouseId,

  salesmanId: dto.salesmanId || null,

  isCredit: dto.isCredit ?? false,

          grossAmount,

          itemDiscountAmount: 0,

          billDiscountAmount:
            billCalc.discountAmount,

          taxableAmount:
            billCalc.taxableAmount,

          cgstAmount: totalCgst,
          sgstAmount: totalSgst,
          igstAmount: totalIgst,

          netAmount:
            billCalc.netAmount,
        },
      });

    for (const row of itemCalculations) {
      await this.prisma.salesBillItem.create({
        data: {
          salesBillId: salesBill.id,

          itemId: row.item.itemId,

          batchId: row.item.batchId,

          qty: row.item.qty,

          saleRate: row.saleRate,

          discountPercent:
            row.item.discountPercent,

          gstPercent:
            row.gstPercent,

          taxableAmount:
            row.calc.taxableAmount,

          cgstAmount:
            row.calc.cgstAmount,

          sgstAmount:
            row.calc.sgstAmount,

          igstAmount:
            row.calc.igstAmount,

          netAmount:
            row.calc.netAmount,
        },
      });

      await this.stockService.postStock(
        row.item.itemId,
        row.item.batchId,
        dto.warehouseId,
        row.item.qty,
        salesBill.id,
      );
    }
    if (
  salesBill.isCredit &&
  salesBill.customerId
) {
  await this.ledgerService.postSales(
    salesBill.customerId,
    Number(salesBill.netAmount),
    salesBill.id,
  );
}

    return salesBill;
  }
}