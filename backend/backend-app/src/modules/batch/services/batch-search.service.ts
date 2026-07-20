import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BatchSearchService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

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

  async findById(id: string) {
    return this.prisma.batch.findUnique({
      where: {
        id,
      },
      include: {
        item: true,
        barcodes: true,
      },
    });
  }

  async findByItem(itemId: string) {
    return this.prisma.batch.findMany({
      where: {
        itemId,
        isActive: true,
      },
      include: {
        barcodes: true,
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

  async findByBarcode(barcode: string) {
    const record =
      await this.prisma.batchBarcode.findUnique({
        where: {
          barcode,
        },
        include: {
          batch: {
            include: {
              item: true,
              barcodes: true,
            },
          },
        },
      });

    return record?.batch ?? null;
  }

  async findMatchingBatch(data: {
    itemId: string;
    purchaseRate: number;
    mrp: number;
    expiryDate?: Date;
    manufacturingDate?: Date;
  }) {
    return this.prisma.batch.findFirst({
      where: {
        itemId: data.itemId,
        purchaseRate: data.purchaseRate,
        mrp: data.mrp,
        expiryDate: data.expiryDate,
        manufacturingDate: data.manufacturingDate,
        isActive: true,
      },
      include: {
        barcodes: true,
      },
    });
  }
}