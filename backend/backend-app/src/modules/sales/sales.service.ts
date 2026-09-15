import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSalesDto } from './dto/create-sales.dto';

import { SalesSaveService } from './services/sales-save.service';
import { SalesCalculationService } from './services/sales-calculation.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesSaveService: SalesSaveService,
    private readonly calculationService: SalesCalculationService,
  ) {}

  async create(
    dto: CreateSalesDto,
    permissions: string[] = [],
  ) {
    return this.salesSaveService.saveSales(
      dto,
      permissions,
    );
  }

  /*
   * =====================================================
   * PREVIEW
   *
   * Runs the full pricing + scheme calculation without
   * saving anything, so the billing screen can show the
   * customer the real total (including scheme-injected
   * free items) before checkout.
   * =====================================================
   */

  async preview(
    dto: CreateSalesDto,
    permissions: string[] = [],
  ) {
    const result = await this.calculationService.calculate(
      dto,
      this.prisma,
      permissions,
    );

    return {
      items: result.itemCalculations.map(
        (row: any) => ({
          itemId: row.item.itemId,
          batchId: row.item.batchId,
          qty: row.item.qty,
          freeQty: row.freeQty || 0,
          schemeId: row.schemeId || null,
          saleRate: row.saleRate,
          discountPercent:
            row.item.discountPercent || 0,
          gstPercent: row.gstPercent,
          taxableAmount: row.finalTaxable,
          cgstAmount: row.finalCgst,
          sgstAmount: row.finalSgst,
          igstAmount: row.finalIgst,
          netAmount: row.finalNetAmount,
        }),
      ),

      grossAmount: result.grossAmount,
      itemDiscountAmount: result.totalItemDiscount,
      billDiscountAmount: result.billDiscountAmount,
      taxableAmount: result.totalTaxable,
      cgstAmount: result.totalCgst,
      sgstAmount: result.totalSgst,
      igstAmount: result.totalIgst,
      netAmount: result.netAmount,
      roundOff: result.roundOff,
      shortAmount: result.shortAmount,
      finalPayable: result.finalPayable,
    };
  }

  async findAll() {
    return this.prisma.salesBill.findMany({
      include: {
        customer: true,

        salesman: true,

        warehouse: true,

        items: {
          include: {
            item: true,
            batch: true,
          },
        },

        payments: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.salesBill.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        salesman: true,

        warehouse: true,

        items: {
          include: {
            item: true,
            batch: true,
          },
        },

        payments: true,
      },
    });
  }
}