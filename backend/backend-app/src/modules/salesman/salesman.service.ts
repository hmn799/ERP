import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSalesmanDto } from './dto/create-salesman.dto';

@Injectable()
export class SalesmanService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateSalesmanDto) {
    return this.prisma.salesman.create({
      data: {
        salesmanCode: dto.salesmanCode,
        name: dto.name,
        mobile: dto.mobile,
      },
    });
  }

  async findAll() {
    return this.prisma.salesman.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.salesman.findUnique({
      where: {
        id,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.salesman.delete({
      where: {
        id,
      },
    });
  }
}