import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../ledger/ledger.service';

import { PurchaseStockService } from './purchase-stock.service';
import { PurchaseGstService } from './purchase-gst.service';

import { CreatePurchaseDto } from '../dto/create-purchase.dto';
import { DocumentNumberService } from '../../../core/document-number/document-number.service';
import { DocumentType } from '../../../core/document-number/document-type.enum';
import { BatchService } from '../../batch/batch.service';
import { WarehouseStockService } from '../../warehouse/services/warehouse-stock.service';

@Injectable()
export class PurchaseSaveService {
  constructor(
  private readonly prisma: PrismaService,

  private readonly stockService: PurchaseStockService,

  private readonly gstService: PurchaseGstService,

  private readonly ledgerService: LedgerService,

  private readonly documentNumberService: DocumentNumberService,

  private readonly batchService: BatchService,

  private readonly warehouseStockService: WarehouseStockService,
) {}

  async savePurchase(
  dto: CreatePurchaseDto,
  purchaseBillId?: string,
) {
    let grossAmount = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    const itemCalculations = dto.items.map((item) => {
      const calc = this.gstService.calculateItem(
        item.qty,
        item.purchaseRate,
        item.discountPercent,
        item.gstPercent,
      );

      grossAmount += calc.grossAmount;
      totalCgst += calc.cgstAmount;
      totalSgst += calc.sgstAmount;
      totalIgst += calc.igstAmount;

      return calc;
    });

    const billCalc = this.gstService.calculateBill(
      grossAmount,
      dto.billDiscountPercent || 0,
      totalCgst,
      totalSgst,
      totalIgst,
    );

   let purchaseBill;

if (!purchaseBillId) {
  purchaseBill = await this.prisma.purchaseBill.create({
    data: {
      billNo: await this.documentNumberService.next(
        DocumentType.PURCHASE_BILL,
      ),

      billDate: dto.billDate,

      supplierId: dto.supplierId,

      warehouseId: dto.warehouseId,

      purchaseOrderId: dto.purchaseOrderId,

      invoiceNo: dto.invoiceNo,

      invoiceDate: dto.invoiceDate,

      grossAmount,

      discountAmount: billCalc.discountAmount,

      taxableAmount: billCalc.taxableAmount,

      cgstAmount: totalCgst,

      sgstAmount: totalSgst,

      igstAmount: totalIgst,

      netAmount: billCalc.netAmount,
    },
  });
} else {
  purchaseBill = await this.prisma.purchaseBill.update({
    where: {
      id: purchaseBillId,
    },

    data: {
      billDate: dto.billDate,

      supplierId: dto.supplierId,

      warehouseId: dto.warehouseId,

      purchaseOrderId: dto.purchaseOrderId,

      invoiceNo: dto.invoiceNo,

      invoiceDate: dto.invoiceDate,

      grossAmount,

      discountAmount: billCalc.discountAmount,

      taxableAmount: billCalc.taxableAmount,

      cgstAmount: totalCgst,

      sgstAmount: totalSgst,

      igstAmount: totalIgst,

      netAmount: billCalc.netAmount,
    },
  });
}

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      const calc = itemCalculations[i];

      const batchResult =
  await this.batchService.resolveBatch({
    itemId: item.itemId,

    purchaseRate: item.purchaseRate,

    retailRate: item.retailRate,

    wholesaleRate: item.wholesaleRate,

    distributorRate: item.distributorRate,

    mrp: item.mrp,

    expiryDate: item.expiryDate,

    manufacturingDate: undefined,

    purchaseBillId: purchaseBill.id,

    barcode: item.barcode,
  });

const batch = batchResult.batch;

await this.warehouseStockService.increaseStock(
  dto.warehouseId,
  item.itemId,
  batch.id,
  item.qty,
);

await this.prisma.purchaseBillItem.create({
  data: {
    purchaseBillId: purchaseBill.id,

    itemId: item.itemId,
    batchId: batch.id,

    qty: item.qty,

    purchaseRate: item.purchaseRate,

    discountPercent: item.discountPercent,
    gstPercent: item.gstPercent,

    taxableAmount: calc.taxableAmount,

    cgstAmount: calc.cgstAmount,
    sgstAmount: calc.sgstAmount,
    igstAmount: calc.igstAmount,

    netAmount: calc.netAmount,
  },
});

      await this.stockService.postStock(
        item.itemId,
        batch.id,
        dto.warehouseId,
        item.qty,
        purchaseBill.id,
      );
    }

    await this.ledgerService.postPurchase(
      purchaseBill.supplierId,
      Number(purchaseBill.netAmount),
      purchaseBill.id,
    );

    // Link Purchase Order if this Purchase was created from one
    if (dto.purchaseOrderId) {
      const poItems = await this.prisma.purchaseOrderItem.findMany({
        where: {
          purchaseOrderId: dto.purchaseOrderId,
        },
      });

      for (const receivedItem of dto.items) {
        const poItem = poItems.find(
          (x) => x.itemId === receivedItem.itemId,
        );

        if (!poItem) continue;

        const qtyReceived =
          Number(poItem.qtyReceived) + Number(receivedItem.qty);

        const pendingQty =
          Number(poItem.qtyOrdered) - qtyReceived;

        await this.prisma.purchaseOrderItem.update({
          where: {
            id: poItem.id,
          },
          data: {
            qtyReceived,
            pendingQty,
          },
        });
      }

      const remaining = await this.prisma.purchaseOrderItem.count({
        where: {
          purchaseOrderId: dto.purchaseOrderId,
          pendingQty: {
            gt: 0,
          },
        },
      });

      await this.prisma.purchaseOrder.update({
        where: {
          id: dto.purchaseOrderId,
        },
        data: {
          status: remaining > 0 ? 'PARTIAL' : 'COMPLETED',
        },
      });
    }

    return purchaseBill;
  }
}