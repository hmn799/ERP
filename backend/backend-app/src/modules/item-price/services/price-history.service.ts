import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { PriceSource } from '@prisma/client';

@Injectable()
export class PriceHistoryService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async createHistory(params: {
    itemId: string;
    priceListId: string;
    oldPrice: number;
    newPrice: number;
    priceSource?: PriceSource;
    changedBy?: string;
    remarks?: string;
  }) {
    return this.prisma.priceHistory.create({
      data: {
        itemId: params.itemId,
        priceListId: params.priceListId,

        oldPrice: params.oldPrice,
        newPrice: params.newPrice,

        priceSource: params.priceSource ?? PriceSource.MANUAL,

        changedBy: params.changedBy,
        remarks: params.remarks,
      },
    });
  }

  async getItemHistory(itemId: string) {
    return this.prisma.priceHistory.findMany({
      where: {
        itemId,
      },
      include: {
        priceList: true,
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
  }

  async getPriceListHistory(priceListId: string) {
    return this.prisma.priceHistory.findMany({
      where: {
        priceListId,
      },
      include: {
        item: true,
      },
      orderBy: {
        changedAt: 'desc',
      },
    });
  }
}