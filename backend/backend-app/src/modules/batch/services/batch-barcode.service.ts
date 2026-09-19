import {
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
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

  /*
   * Manual add, distinct from createAlternateBarcode (which is used by
   * the automatic purchase-resolve flow and silently no-ops on a
   * collision). Here a collision is a real error the operator needs to
   * see - barcode is globally unique across every batch.
   */
  async addBarcode(batchId: string, barcode: string) {
    const batch = await this.prisma.batch.findUnique({
      where: { id: batchId },
    });

    if (!batch) {
      throw new NotFoundException("Batch not found.");
    }

    const existing = await this.prisma.batchBarcode.findUnique({
      where: { barcode },
    });

    if (existing) {
      throw new ConflictException(
        existing.batchId === batchId
          ? "This barcode is already linked to this batch."
          : "This barcode is already linked to another batch.",
      );
    }

    const barcodeCount = await this.prisma.batchBarcode.count({
      where: { batchId },
    });

    return this.prisma.batchBarcode.create({
      data: {
        batchId,
        barcode,
        // The first barcode ever added to a batch becomes primary by
        // default so every batch always has one designated barcode.
        isPrimary: barcodeCount === 0,
      },
    });
  }

  async removeBarcode(batchId: string, barcodeId: string) {
    const record = await this.prisma.batchBarcode.findUnique({
      where: { id: barcodeId },
    });

    if (!record || record.batchId !== batchId) {
      throw new NotFoundException(
        "Barcode not found on this batch.",
      );
    }

    await this.prisma.batchBarcode.delete({
      where: { id: barcodeId },
    });

    // If the removed barcode was primary, promote the oldest remaining
    // one so the batch never silently ends up with barcodes but no
    // designated primary.
    if (record.isPrimary) {
      const next = await this.prisma.batchBarcode.findFirst({
        where: { batchId },
        orderBy: { createdAt: "asc" },
      });

      if (next) {
        await this.prisma.batchBarcode.update({
          where: { id: next.id },
          data: { isPrimary: true },
        });
      }
    }
  }

  async setPrimaryBarcode(batchId: string, barcodeId: string) {
    const record = await this.prisma.batchBarcode.findUnique({
      where: { id: barcodeId },
    });

    if (!record || record.batchId !== batchId) {
      throw new NotFoundException(
        "Barcode not found on this batch.",
      );
    }

    await this.prisma.$transaction([
      this.prisma.batchBarcode.updateMany({
        where: { batchId },
        data: { isPrimary: false },
      }),
      this.prisma.batchBarcode.update({
        where: { id: barcodeId },
        data: { isPrimary: true },
      }),
    ]);
  }
}