import { Injectable } from "@nestjs/common";
import { Prisma } from "@prisma/client";

import { PrismaService } from "../../prisma/prisma.service";

@Injectable()
export class BatchBarcodeService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findBarcode(
    barcode: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.batchBarcode.findUnique({
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
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    if (!barcode) return;

    return prisma.batchBarcode.create({
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
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    if (!barcode) return;

    const exists =
      await prisma.batchBarcode.findUnique({
        where: {
          barcode,
        },
      });

    if (exists) {
      return exists;
    }

    return prisma.batchBarcode.create({
      data: {
        batchId,
        barcode,
        isPrimary: false,
      },
    });
  }

  async getBarcodes(
    batchId: string,
    prisma: Prisma.TransactionClient = this.prisma,
  ) {
    return prisma.batchBarcode.findMany({
      where: {
        batchId,
      },
      orderBy: {
        isPrimary: "desc",
      },
    });
  }
}