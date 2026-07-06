import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../modules/prisma/prisma.service';

import { StockMovementDto } from './dto/stock-movement.dto';
import { StockMovementType } from './stock-movement-type.enum';
import { NegativeStockPolicy } from './negative-stock-policy.enum';

@Injectable()
export class StockEngineService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async postMovement(
    dto: StockMovementDto,
  ) {
    const warehouse =
      await this.prisma.warehouse.findUnique({
        where: {
          id: dto.warehouseId,
        },
      });

    if (!warehouse) {
      throw new NotFoundException(
        'Warehouse not found.',
      );
    }

    const item =
      await this.prisma.item.findUnique({
        where: {
          id: dto.itemId,
        },
      });

    if (!item) {
      throw new NotFoundException(
        'Item not found.',
      );
    }

    const batch =
      await this.prisma.batch.findUnique({
        where: {
          id: dto.batchId,
        },
      });

    if (!batch) {
      throw new NotFoundException(
        'Batch not found.',
      );
    }

    const quantity = Number(dto.qty);

    const signedQty =
      dto.movementType === StockMovementType.PURCHASE ||
      dto.movementType === StockMovementType.SALES_RETURN ||
      dto.movementType === StockMovementType.OPENING ||
      dto.movementType === StockMovementType.STOCK_TRANSFER_IN ||
      dto.movementType === StockMovementType.PRODUCTION_IN
        ? quantity
        : -quantity;

    const NEGATIVE_STOCK_POLICY =
      NegativeStockPolicy.BLOCK;

    if (
      signedQty < 0 &&
      NEGATIVE_STOCK_POLICY ===
        NegativeStockPolicy.BLOCK
    ) {
      const balance =
        await this.prisma.warehouseStock.findUnique({
          where: {
            warehouseId_itemId_batchId: {
              warehouseId: dto.warehouseId,
              itemId: dto.itemId,
              batchId: dto.batchId,
            },
          },
        });

      const available =
        Number(balance?.quantity ?? 0);

      if (available < Math.abs(signedQty)) {
        throw new BadRequestException(
          `Insufficient stock. Available: ${available}, Required: ${Math.abs(
            signedQty,
          )}`,
        );
      }
    }

    return this.prisma.$transaction(
      async (tx) => {
        const movement =
          await tx.stockLedger.create({
            data: {
              warehouseId: dto.warehouseId,

              itemId: dto.itemId,

              batchId: dto.batchId,

              transactionDate: dto.movementDate,

              transactionType: dto.movementType,

              qtyIn:
                signedQty > 0
                  ? signedQty
                  : 0,

              qtyOut:
                signedQty < 0
                  ? Math.abs(signedQty)
                  : 0,

              referenceType:
                dto.referenceType,

              referenceId:
                dto.referenceId,

              remarks:
                dto.remarks,
            },
          });

        const existing =
          await tx.warehouseStock.findUnique({
            where: {
              warehouseId_itemId_batchId: {
                warehouseId:
                  dto.warehouseId,

                itemId:
                  dto.itemId,

                batchId:
                  dto.batchId,
              },
            },
          });

        if (existing) {
          await tx.warehouseStock.update({
            where: {
              id: existing.id,
            },
            data: {
              quantity:
                Number(existing.quantity) +
                signedQty,
            },
          });
        } else {
          await tx.warehouseStock.create({
            data: {
              warehouseId:
                dto.warehouseId,

              itemId:
                dto.itemId,

              batchId:
                dto.batchId,

              quantity:
                signedQty,
            },
          });
        }

        return movement;
      },
    );
  }
}