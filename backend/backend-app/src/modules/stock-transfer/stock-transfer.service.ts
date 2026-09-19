import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../prisma/prisma.service";
import { DocumentNumberService } from "../../core/document-number/document-number.service";

import { CreateStockTransferDto } from "./dto/create-stock-transfer.dto";

const REFERENCE_TYPE = "STOCK_TRANSFER";
const DOCUMENT_TYPE = "ST";

@Injectable()
export class StockTransferService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  private async isNegativeStockAllowed(
    tx: Prisma.TransactionClient,
  ): Promise<boolean> {
    const setting = await tx.systemSetting.findUnique({
      where: { settingKey: "ALLOW_NEGATIVE_STOCK" },
    });

    return setting
      ? setting.value.toLowerCase() === "true"
      : false;
  }

  async create(dto: CreateStockTransferDto) {
    if (dto.fromWarehouseId === dto.toWarehouseId) {
      throw new BadRequestException(
        "Source and destination warehouse must be different.",
      );
    }

    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.prisma.warehouse.findUnique({
        where: { id: dto.fromWarehouseId },
      }),
      this.prisma.warehouse.findUnique({
        where: { id: dto.toWarehouseId },
      }),
    ]);

    if (!fromWarehouse) {
      throw new BadRequestException("Source warehouse not found.");
    }

    if (!toWarehouse) {
      throw new BadRequestException("Destination warehouse not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      const transferNo = await this.documentNumberService.nextInTransaction(
        DOCUMENT_TYPE,
        tx,
      );

      const transfer = await tx.stockTransfer.create({
        data: {
          transferNo,
          transferDate: new Date(dto.transferDate),
          fromWarehouseId: dto.fromWarehouseId,
          toWarehouseId: dto.toWarehouseId,
          remarks: dto.remarks,
        },
      });

      const allowNegativeStock = await this.isNegativeStockAllowed(tx);

      for (const line of dto.items) {
        const sourceStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: dto.fromWarehouseId,
              itemId: line.itemId,
              batchId: line.batchId,
            },
          },
          include: { item: true, batch: true },
        });

        const available = sourceStock ? Number(sourceStock.quantity) : 0;

        if (!allowNegativeStock && line.qty > available) {
          const label = sourceStock
            ? `${sourceStock.item.name} (${sourceStock.batch.batchNo})`
            : `item ${line.itemId}`;

          throw new BadRequestException(
            `Insufficient stock for ${label} in source warehouse. Available: ${available}, requested: ${line.qty}.`,
          );
        }

        await tx.warehouseStock.upsert({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: dto.fromWarehouseId,
              itemId: line.itemId,
              batchId: line.batchId,
            },
          },
          create: {
            warehouseId: dto.fromWarehouseId,
            itemId: line.itemId,
            batchId: line.batchId,
            quantity: -line.qty,
          },
          update: {
            quantity: { decrement: line.qty },
          },
        });

        await tx.warehouseStock.upsert({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: dto.toWarehouseId,
              itemId: line.itemId,
              batchId: line.batchId,
            },
          },
          create: {
            warehouseId: dto.toWarehouseId,
            itemId: line.itemId,
            batchId: line.batchId,
            quantity: line.qty,
          },
          update: {
            quantity: { increment: line.qty },
          },
        });

        await tx.stockTransferItem.create({
          data: {
            stockTransferId: transfer.id,
            itemId: line.itemId,
            batchId: line.batchId,
            qty: line.qty,
          },
        });

        await tx.stockLedger.create({
          data: {
            transactionDate: new Date(dto.transferDate),
            transactionType: "STOCK_TRANSFER_OUT",
            itemId: line.itemId,
            batchId: line.batchId,
            warehouseId: dto.fromWarehouseId,
            qtyIn: 0,
            qtyOut: line.qty,
            referenceType: REFERENCE_TYPE,
            referenceId: transfer.id,
            remarks: `Transfer to ${toWarehouse.name}`,
          },
        });

        await tx.stockLedger.create({
          data: {
            transactionDate: new Date(dto.transferDate),
            transactionType: "STOCK_TRANSFER_IN",
            itemId: line.itemId,
            batchId: line.batchId,
            warehouseId: dto.toWarehouseId,
            qtyIn: line.qty,
            qtyOut: 0,
            referenceType: REFERENCE_TYPE,
            referenceId: transfer.id,
            remarks: `Transfer from ${fromWarehouse.name}`,
          },
        });
      }

      return tx.stockTransfer.findUnique({
        where: { id: transfer.id },
        include: {
          fromWarehouse: true,
          toWarehouse: true,
          items: { include: { item: true, batch: true } },
        },
      });
    });
  }

  async findAll() {
    return this.prisma.stockTransfer.findMany({
      include: {
        fromWarehouse: { select: { name: true } },
        toWarehouse: { select: { name: true } },
        items: true,
      },
      orderBy: { transferDate: "desc" },
    });
  }

  async findOne(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: {
        fromWarehouse: true,
        toWarehouse: true,
        items: { include: { item: true, batch: true } },
      },
    });

    if (!transfer) {
      throw new NotFoundException("Stock transfer not found.");
    }

    return transfer;
  }

  async remove(id: string) {
    const transfer = await this.prisma.stockTransfer.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!transfer) {
      throw new NotFoundException("Stock transfer not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      for (const line of transfer.items) {
        const destStock = await tx.warehouseStock.findUnique({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: transfer.toWarehouseId,
              itemId: line.itemId,
              batchId: line.batchId,
            },
          },
        });

        const destQty = destStock ? Number(destStock.quantity) : 0;

        if (destQty < Number(line.qty)) {
          throw new BadRequestException(
            "Cannot delete - some of this transferred stock has already been sold or moved from the destination warehouse.",
          );
        }

        await tx.warehouseStock.update({
          where: { id: destStock!.id },
          data: { quantity: { decrement: Number(line.qty) } },
        });

        await tx.warehouseStock.update({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: transfer.fromWarehouseId,
              itemId: line.itemId,
              batchId: line.batchId,
            },
          },
          data: { quantity: { increment: Number(line.qty) } },
        });
      }

      await tx.stockLedger.deleteMany({
        where: { referenceType: REFERENCE_TYPE, referenceId: transfer.id },
      });

      await tx.stockTransferItem.deleteMany({
        where: { stockTransferId: transfer.id },
      });

      await tx.stockTransfer.delete({ where: { id: transfer.id } });

      return { success: true };
    });
  }
}
