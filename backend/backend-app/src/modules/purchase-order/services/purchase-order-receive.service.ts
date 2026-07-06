import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

import { PurchaseSaveService } from '../../purchase/services/purchase-save.service';

import { CreatePurchaseDto } from '../../purchase/dto/create-purchase.dto';
import { CreatePurchaseItemDto } from '../../purchase/dto/create-purchase-item.dto';

import { ReceivePurchaseOrderDto } from '../dto/receive-purchase-order.dto';

@Injectable()
export class PurchaseOrderReceiveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly purchaseSaveService: PurchaseSaveService,
  ) {}

  async receive(
    purchaseOrderId: string,
    dto: ReceivePurchaseOrderDto,
  ) {
    const purchaseOrder =
      await this.prisma.purchaseOrder.findUnique({
        where: {
          id: purchaseOrderId,
        },
        include: {
          supplier: true,

          warehouse: true,

          items: {
            include: {
              item: true,
            },
          },
        },
      });

    if (!purchaseOrder) {
      throw new Error('Purchase Order not found');
    }

    if (purchaseOrder.status === 'COMPLETED') {
      throw new Error(
        'Purchase Order already completed',
      );
    }

    if (
      dto.items.length === 0
    ) {
      throw new Error(
        'No items received',
      );
    }

    const purchaseItems: CreatePurchaseItemDto[] = [];

    for (const receiveItem of dto.items) {
      const poItem =
        purchaseOrder.items.find(
          (x) =>
            x.id ===
            receiveItem.purchaseOrderItemId,
        );

      if (!poItem) {
        throw new Error(
          `Purchase Order Item not found`,
        );
      }

      const pending =
        Number(poItem.pendingQty);

      if (
        receiveItem.qtyReceived <= 0
      ) {
        throw new Error(
          'Invalid received quantity',
        );
      }

      if (
        receiveItem.qtyReceived >
        pending
      ) {
        throw new Error(
          `Received quantity exceeds pending quantity for ${poItem.item.name}`,
        );
      }

      purchaseItems.push({
        itemId: poItem.itemId,

        batchNo:
          receiveItem.batchNo,

        qty:
          receiveItem.qtyReceived,

        purchaseRate:
          receiveItem.purchaseRate ??
          Number(poItem.purchaseRate),

        retailRate:
          receiveItem.retailRate ?? 0,

        wholesaleRate:
          receiveItem.wholesaleRate ?? 0,

        distributorRate:
          receiveItem.distributorRate ?? 0,

        mrp:
          receiveItem.mrp ?? 0,

        expiryDate:
          receiveItem.expiryDate
            ? new Date(
                receiveItem.expiryDate,
              )
            : undefined,

        barcode:
          receiveItem.barcode,

        discountPercent:
          Number(
            poItem.discountPercent,
          ),

        gstPercent:
          Number(
            poItem.gstPercent,
          ),
      });
    }
        let billNo = dto.billNo;

    if (!billNo) {
      const lastBill =
        await this.prisma.purchaseBill.findFirst({
          orderBy: {
            createdAt: 'desc',
          },
        });

      let nextNumber = 1001;

      if (
        lastBill &&
        lastBill.billNo
      ) {
        const number = Number(
          lastBill.billNo.replace(
            'PB',
            '',
          ),
        );

        if (!isNaN(number)) {
          nextNumber =
            number + 1;
        }
      }

      billNo =
        `PB${nextNumber}`;
    }

    const purchaseDto: CreatePurchaseDto = {
      billNo,

      billDate:
        dto.billDate ??
        new Date(),

      supplierId:
        purchaseOrder.supplierId,

      warehouseId:
        purchaseOrder.warehouseId,

      purchaseOrderId:
        purchaseOrder.id,

      invoiceNo:
        dto.invoiceNo,

      invoiceDate:
        dto.invoiceDate,

      items:
        purchaseItems,
    };

    const purchaseBill =
      await this.purchaseSaveService.savePurchase(
        purchaseDto,
      );

    return {
      message:
        'Purchase Order received successfully',

      purchaseBill,
          };
  }
}