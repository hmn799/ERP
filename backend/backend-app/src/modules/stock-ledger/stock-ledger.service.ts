import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class StockLedgerService {
  constructor(private prisma: PrismaService) {}

  async findAll() {
    return this.prisma.stockLedger.findMany({
      include: {
        item: true,
        warehouse: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.stockLedger.findUnique({
      where: { id },
      include: {
        item: true,
        warehouse: true,
      },
    });
  }
}