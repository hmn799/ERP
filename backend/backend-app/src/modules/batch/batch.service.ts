import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { BatchResolveService } from './services/batch-resolve.service';
import { BatchSearchService } from './services/batch-search.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly batchResolveService: BatchResolveService,

    private readonly batchSearchService: BatchSearchService,
  ) {}

  async resolveBatch(data: {
    itemId: string;

    purchaseRate: number;

    retailRate: number;

    wholesaleRate: number;

    distributorRate: number;

    mrp: number;

    expiryDate?: Date;

    manufacturingDate?: Date;

    purchaseBillId?: string;

    barcode?: string;
  }) {
    return this.batchResolveService.resolve(data);
  }

  async findAll() {
    return this.prisma.batch.findMany({
      include: {
        item: true,
        barcodes: true,
      },
      orderBy: [
        {
          item: {
            name: 'asc',
          },
        },
        {
          batchNo: 'asc',
        },
      ],
    });
  }

  async findOne(id: string) {
    const batch =
      await this.batchSearchService.findById(id);

    if (!batch) {
      throw new NotFoundException(
        'Batch not found',
      );
    }

    return batch;
  }

  async findByBarcode(barcode: string) {
    return this.batchSearchService.findByBarcode(
      barcode,
    );
  }

  async findByItem(itemId: string) {
    return this.batchSearchService.findByItem(
      itemId,
    );
  }

  async remove(id: string) {
    const batch =
      await this.batchSearchService.findById(id);

    if (!batch) {
      throw new NotFoundException(
        'Batch not found',
      );
    }

    return this.prisma.batch.update({
      where: {
        id,
      },
      data: {
        isActive: false,
      },
    });
  }
}