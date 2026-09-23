import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { DocumentNumberService } from '../../core/document-number/document-number.service';

import { CreateStockDamageDto } from './dto/create-stock-damage.dto';

@Injectable()
export class StockDamageService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  async create(dto: CreateStockDamageDto) {
    return this.prisma.$transaction(async (tx) => {
      const batch = await tx.batch.findUnique({
        where: { id: dto.batchId },
      });

      if (!batch) {
        throw new BadRequestException('Invalid batch.');
      }

      if (batch.itemId !== dto.itemId) {
        throw new BadRequestException(
          'Batch does not belong to item.',
        );
      }

      const stock = await tx.warehouseStock.findUnique({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId: dto.warehouseId,
            itemId: dto.itemId,
            batchId: dto.batchId,
          },
        },
      });

      const currentStock = stock
        ? Number(stock.quantity)
        : 0;

      const setting = await tx.systemSetting.findUnique({
        where: { settingKey: 'ALLOW_NEGATIVE_STOCK' },
      });

      const allowNegativeStock =
        setting?.value?.toLowerCase() === 'true';

      if (
        !allowNegativeStock &&
        dto.qty > currentStock
      ) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${currentStock}. Requested: ${dto.qty}.`,
        );
      }

      const damageNo =
        await this.documentNumberService.nextInTransaction(
          'DMG',
          tx,
        );

      const costValue =
        dto.qty * Number(batch.purchaseRate);

      const damage = await tx.stockDamage.create({
        data: {
          damageNo,
          damageDate: new Date(dto.damageDate),
          warehouseId: dto.warehouseId,
          itemId: dto.itemId,
          batchId: dto.batchId,
          qty: dto.qty,
          costValue,
          reason: dto.reason,
        },
      });

      await tx.warehouseStock.upsert({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId: dto.warehouseId,
            itemId: dto.itemId,
            batchId: dto.batchId,
          },
        },
        create: {
          warehouseId: dto.warehouseId,
          itemId: dto.itemId,
          batchId: dto.batchId,
          quantity: -dto.qty,
        },
        update: {
          quantity: { decrement: dto.qty },
        },
      });

      await tx.stockLedger.create({
        data: {
          transactionDate: new Date(dto.damageDate),
          transactionType: 'DAMAGE',
          itemId: dto.itemId,
          batchId: dto.batchId,
          warehouseId: dto.warehouseId,
          qtyIn: 0,
          qtyOut: dto.qty,
          referenceType: 'STOCK_DAMAGE',
          referenceId: damage.id,
          remarks: dto.reason,
        },
      });

      return damage;
    });
  }

  findAll() {
    return this.prisma.stockDamage.findMany({
      include: {
        item: true,
        batch: true,
        warehouse: true,
      },
      orderBy: { damageDate: 'desc' },
    });
  }

  async findOne(id: string) {
    const damage = await this.prisma.stockDamage.findUnique({
      where: { id },
      include: { item: true, batch: true, warehouse: true },
    });

    if (!damage) {
      throw new NotFoundException(
        'Stock damage entry not found.',
      );
    }

    return damage;
  }

  /*
   * Undoes a write-off entered by mistake - restores the stock it
   * removed and marks the entry CANCELLED (kept, not deleted, for
   * the audit trail) rather than silently disappearing from the
   * Profit Report loss it had booked.
   */
  async cancel(id: string) {
    const existing = await this.findOne(id);

    if (existing.status === 'CANCELLED') {
      throw new BadRequestException(
        'This entry is already cancelled.',
      );
    }

    return this.prisma.$transaction(async (tx) => {
      await tx.warehouseStock.upsert({
        where: {
          warehouseId_itemId_batchId: {
            warehouseId: existing.warehouseId,
            itemId: existing.itemId,
            batchId: existing.batchId,
          },
        },
        create: {
          warehouseId: existing.warehouseId,
          itemId: existing.itemId,
          batchId: existing.batchId,
          quantity: existing.qty,
        },
        update: {
          quantity: { increment: existing.qty },
        },
      });

      await tx.stockLedger.create({
        data: {
          transactionDate: new Date(),
          transactionType: 'DAMAGE_REVERSAL',
          itemId: existing.itemId,
          batchId: existing.batchId,
          warehouseId: existing.warehouseId,
          qtyIn: existing.qty,
          qtyOut: 0,
          referenceType: 'STOCK_DAMAGE',
          referenceId: existing.id,
          remarks: `Reversed: ${existing.reason}`,
        },
      });

      return tx.stockDamage.update({
        where: { id },
        data: { status: 'CANCELLED' },
      });
    });
  }
}
