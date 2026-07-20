import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class BatchBarcodeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findBarcode(barcode: string) {
    return this.prisma.batchBarcode.findUnique({
      where: {
        barcode,
      },
      include: {
        batch: {
          include: {
            item: true,
          },
        },
      },
    });
  }

  async createPrimaryBarcode(
    batchId: string,
    barcode: string,
  ) {
    if (!barcode) return;

    return this.prisma.batchBarcode.create({
      data: {
        batchId,
        barcode,
        isPrimary: true,
      },
    });
  }

  async createAlternateBarcode(
    batchId: string,
    barcode: string,
  ) {
    if (!barcode) return;

    const exists =
      await this.prisma.batchBarcode.findUnique({
        where: {
          barcode,
        },
      });

    if (exists) {
      return exists;
    }

    return this.prisma.batchBarcode.create({
      data: {
        batchId,
        barcode,
        isPrimary: false,
      },
    });
  }

  async getBarcodes(batchId: string) {
    return this.prisma.batchBarcode.findMany({
      where: {
        batchId,
      },
      orderBy: {
        isPrimary: 'desc',
      },
    });
  }
}