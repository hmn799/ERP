import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSalesDto } from './dto/create-sales.dto';

import { SalesSaveService } from './services/sales-save.service';

@Injectable()
export class SalesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly salesSaveService: SalesSaveService,
  ) {}

  async create(dto: CreateSalesDto) {
    return this.salesSaveService.saveSales(dto);
  }

  async findAll() {
    return this.prisma.salesBill.findMany({
      include: {
        customer: true,

        salesman: true,

        warehouse: true,

        items: {
          include: {
            item: true,
            batch: true,
          },
        },

        payments: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.salesBill.findUnique({
      where: {
        id,
      },

      include: {
        customer: true,

        salesman: true,

        warehouse: true,

        items: {
          include: {
            item: true,
            batch: true,
          },
        },

        payments: true,
      },
    });
  }
}