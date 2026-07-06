import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateWarehouseDto } from './dto/create-warehouse.dto';

@Injectable()
export class WarehouseService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateWarehouseDto) {
    return this.prisma.warehouse.create({
      data: {
        name: dto.name,
      },
    });
  }

  findAll() {
    return this.prisma.warehouse.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.warehouse.findUnique({
      where: { id },
    });
  }

  remove(id: string) {
    return this.prisma.warehouse.delete({
      where: { id },
    });
  }
}