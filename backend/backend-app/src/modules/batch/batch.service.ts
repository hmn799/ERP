import { Injectable, NotFoundException } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class BatchService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findAll() {
    return this.prisma.batch.findMany({
      include: {
        item: true,
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
    const batch = await this.prisma.batch.findUnique({
      where: {
        id,
      },
      include: {
        item: true,
      },
    });

    if (!batch) {
      throw new NotFoundException(
        'Batch not found',
      );
    }

    return batch;
  }

  async findByBarcode(barcode: string) {
    return this.prisma.batch.findMany({
      where: {
        barcode,
        isActive: true,
      },
      include: {
        item: true,
      },
      orderBy: {
        expiryDate: 'asc',
      },
    });
  }

  async findByItem(itemId: string) {
    return this.prisma.batch.findMany({
      where: {
        itemId,
        isActive: true,
      },
      orderBy: [
        {
          expiryDate: 'asc',
        },
        {
          batchNo: 'asc',
        },
      ],
    });
  }

  async remove(id: string) {
    const batch = await this.prisma.batch.findUnique({
      where: {
        id,
      },
    });

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