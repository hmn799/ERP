import {
  BadRequestException,
  Injectable,
} from '@nestjs/common';

import { PrismaService } from '../../modules/prisma/prisma.service';

import { AllocateStockDto } from './dto/allocate-stock.dto';

@Injectable()
export class FifoEngineService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async allocateStock(
    dto: AllocateStockDto,
  ) {
    const batches =
      await this.prisma.warehouseStock.findMany({
        where: {
          warehouseId: dto.warehouseId,
          itemId: dto.itemId,
          quantity: {
            gt: 0,
          },
        },

        include: {
          batch: true,
        },

        orderBy: {
          batch: {
            createdAt: 'asc',
          },
        },
      });

    let remainingQty =
      Number(dto.requiredQty);

    const allocations: {
      batchId: string;
      batchNo: string;
      qty: number;
    }[] = [];

    for (const stock of batches) {
      if (remainingQty <= 0) {
        break;
      }

      const available =
        Number(stock.quantity);

      const allocateQty =
        Math.min(
          available,
          remainingQty,
        );

      allocations.push({
        batchId: stock.batchId,
        batchNo: stock.batch.batchNo,
        qty: allocateQty,
      });

      remainingQty -= allocateQty;
    }

    if (remainingQty > 0) {
      throw new BadRequestException(
        `Insufficient stock. Short by ${remainingQty}`,
      );
    }

    return allocations;
  }
}