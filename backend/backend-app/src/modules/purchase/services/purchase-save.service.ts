import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../ledger/ledger.service';

import { PurchaseStockService } from './purchase-stock.service';
import { PurchaseGstService } from './purchase-gst.service';

import { CreatePurchaseDto } from '../dto/create-purchase.dto';
import { DocumentNumberService } from '../../../core/document-number/document-number.service';
import { DocumentType } from '../../../core/document-number/document-type.enum';

@Injectable()
export class PurchaseSaveService {
  constructor(
  private prisma: PrismaService,
  private stockService: PurchaseStockService,
  private gstService: PurchaseGstService,
  private ledgerService: LedgerService,
  private documentNumberService: DocumentNumberService,
) {}

  async savePurchase(dto: CreatePurchaseDto) {
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

    const purchaseBill = await this.prisma.purchaseBill.create({
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

    for (let i = 0; i < dto.items.length; i++) {
      const item = dto.items[i];
      const calc = itemCalculations[i];

      const batch =
  await this.stockService.createOrGetBatch(
    item.itemId,
    item.batchNo,
    item.purchaseRate,
    item.retailRate,
    item.wholesaleRate,
    item.distributorRate,
    item.mrp,
    item.expiryDate,
    item.barcode,
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