import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { PurchaseOrderGstService } from './purchase-order-gst.service';

import { CreatePurchaseOrderDto } from '../dto/create-purchase-order.dto';
import { DocumentNumberService } from '../../../core/document-number/document-number.service';
import { DocumentType } from '../../../core/document-number/document-type.enum';

@Injectable()
export class PurchaseOrderSaveService {
  constructor(
  private readonly prisma: PrismaService,
  private readonly gstService: PurchaseOrderGstService,
  private readonly documentNumberService: DocumentNumberService,
) {}

  async create(
    dto: CreatePurchaseOrderDto,
  ) {
    const supplier =
      await this.prisma.supplier.findUnique({
        where: {
          id: dto.supplierId,
        },
      });

    if (!supplier) {
      throw new Error('Supplier not found');
    }

    const warehouse =
      await this.prisma.warehouse.findUnique({
        where: {
          id: dto.warehouseId,
        },
      });

    if (!warehouse) {
      throw new Error('Warehouse not found');
    }

    const poNo =
  await this.documentNumberService.next(
    DocumentType.PURCHASE_ORDER,
  );

    let grossAmount = 0;
    let discountAmount = 0;
    let taxableAmount = 0;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    let netAmount = 0;

    const calculatedItems: {
      row: any;
      calc: any;
    }[] = [];

    for (const row of dto.items) {
      const calc =
        this.gstService.calculate(
          row.qtyOrdered,
          row.purchaseRate,
          row.discountPercent,
          row.gstPercent,
        );

      grossAmount +=
        calc.grossAmount;

      discountAmount +=
        calc.discountAmount;

      taxableAmount +=
        calc.taxableAmount;

      cgstAmount +=
        calc.cgstAmount;

      sgstAmount +=
        calc.sgstAmount;

      igstAmount +=
        calc.igstAmount;

      netAmount +=
        calc.netAmount;

      calculatedItems.push({
        row,
        calc,
      });
    }

    const purchaseOrder =
      await this.prisma.purchaseOrder.create({
        data: {
          poNo,

          poDate:
            new Date(dto.orderDate),

          supplierId:
            dto.supplierId,

          warehouseId:
            dto.warehouseId,

          status:
            'PENDING',

          grossAmount,

          discountAmount,

          taxableAmount,

          cgstAmount,

          sgstAmount,

          igstAmount,

          netAmount,

          remarks:
            dto.remarks,
        },
      });
          for (const item of calculatedItems) {
      await this.prisma.purchaseOrderItem.create({
        data: {
          purchaseOrderId: purchaseOrder.id,

          itemId: item.row.itemId,

          qtyOrdered: item.row.qtyOrdered,

          qtyReceived: 0,

          pendingQty: item.row.qtyOrdered,

          purchaseRate: item.row.purchaseRate,

          discountPercent:
            item.row.discountPercent,

          gstPercent:
            item.row.gstPercent,

          taxableAmount:
            item.calc.taxableAmount,

          cgstAmount:
            item.calc.cgstAmount,

          sgstAmount:
            item.calc.sgstAmount,

          igstAmount:
            item.calc.igstAmount,

          netAmount:
            item.calc.netAmount,
        },
      });
    }

    return this.prisma.purchaseOrder.findUnique({
      where: {
        id: purchaseOrder.id,
      },
      include: {
        supplier: true,

        warehouse: true,

        items: {
          include: {
            item: true,
          },
        },

        purchaseBills: true,
      },
    });
  }
}