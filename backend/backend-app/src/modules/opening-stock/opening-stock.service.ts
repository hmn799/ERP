import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { PrismaService } from "../prisma/prisma.service";
import { BatchService } from "../batch/batch.service";
import { WarehouseStockService } from "../warehouse/services/warehouse-stock.service";

import { CreateOpeningStockDto } from "./dto/create-opening-stock.dto";

export interface BulkOpeningStockError {
  row: number;
  message: string;
}

export interface BulkOpeningStockResult {
  total: number;
  successCount: number;
  errors: BulkOpeningStockError[];
}

const REFERENCE_TYPE = "OPENING_STOCK";

@Injectable()
export class OpeningStockService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly batchService: BatchService,
    private readonly warehouseStockService: WarehouseStockService,
  ) {}

  async create(dto: CreateOpeningStockDto) {
    const [item, warehouse] = await Promise.all([
      this.prisma.item.findUnique({ where: { id: dto.itemId } }),
      this.prisma.warehouse.findUnique({ where: { id: dto.warehouseId } }),
    ]);

    if (!item) {
      throw new BadRequestException("Item not found.");
    }

    if (!warehouse) {
      throw new BadRequestException("Warehouse not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      const batchResult = await this.batchService.resolveBatch(
        {
          itemId: dto.itemId,
          purchaseRate: dto.purchaseRate,
          retailRate: dto.retailRate,
          wholesaleRate: dto.wholesaleRate,
          distributorRate: dto.distributorRate,
          mrp: dto.mrp,
          expiryDate: dto.expiryDate ? new Date(dto.expiryDate) : undefined,
          manufacturingDate: dto.manufacturingDate
            ? new Date(dto.manufacturingDate)
            : undefined,
        },
        tx,
      );

      const batch = batchResult.batch;

      await this.warehouseStockService.increaseStock(
        dto.warehouseId,
        dto.itemId,
        batch.id,
        dto.qty,
        tx,
      );

      return tx.stockLedger.create({
        data: {
          transactionDate: dto.transactionDate
            ? new Date(dto.transactionDate)
            : new Date(),
          transactionType: REFERENCE_TYPE,
          itemId: dto.itemId,
          batchId: batch.id,
          warehouseId: dto.warehouseId,
          qtyIn: dto.qty,
          qtyOut: 0,
          referenceType: REFERENCE_TYPE,
          referenceId: batch.id,
          remarks: dto.remarks || "Opening Stock",
        },
        include: {
          item: { select: { name: true, itemCode: true } },
          warehouse: { select: { name: true } },
          batch: {
            select: { batchNo: true, mrp: true, expiryDate: true },
          },
        },
      });
    });
  }

  async bulkCreate(rows: Record<string, unknown>[]): Promise<BulkOpeningStockResult> {
    const errors: BulkOpeningStockError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 1;

      const dto = plainToInstance(CreateOpeningStockDto, rows[i], {
        enableImplicitConversion: true,
      });

      const violations = await validate(dto as object, {
        whitelist: true,
      });

      if (violations.length > 0) {
        const messages = violations
          .flatMap((violation) =>
            Object.values(violation.constraints ?? {}),
          )
          .join(" ");

        errors.push({ row: rowNumber, message: messages });
        continue;
      }

      try {
        await this.create(dto);
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          message:
            error instanceof Error ? error.message : "Failed to save row.",
        });
      }
    }

    return { total: rows.length, successCount, errors };
  }

  async list() {
    return this.prisma.stockLedger.findMany({
      where: { referenceType: REFERENCE_TYPE },
      orderBy: { transactionDate: "desc" },
      include: {
        item: { select: { name: true, itemCode: true } },
        warehouse: { select: { name: true } },
        batch: {
          select: { batchNo: true, mrp: true, expiryDate: true },
        },
      },
    });
  }

  async remove(id: string) {
    const entry = await this.prisma.stockLedger.findUnique({
      where: { id },
    });

    if (!entry || entry.referenceType !== REFERENCE_TYPE) {
      throw new NotFoundException("Opening stock entry not found.");
    }

    return this.prisma.$transaction(async (tx) => {
      const stock = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId: entry.warehouseId,
            itemId: entry.itemId,
            batchId: entry.batchId,
          },
        },
      });

      if (!stock || Number(stock.quantity) < Number(entry.qtyIn)) {
        throw new BadRequestException(
          "Cannot delete - some of this stock has already been sold or moved.",
        );
      }

      await tx.warehouseStock.update({
        where: { id: stock.id },
        data: { quantity: { decrement: Number(entry.qtyIn) } },
      });

      await tx.stockLedger.delete({ where: { id: entry.id } });

      const remainingMovements = await tx.stockLedger.count({
        where: { batchId: entry.batchId },
      });

      if (remainingMovements === 0) {
        await tx.batch.update({
          where: { id: entry.batchId },
          data: { isActive: false },
        });
      }

      return { success: true };
    });
  }
}
