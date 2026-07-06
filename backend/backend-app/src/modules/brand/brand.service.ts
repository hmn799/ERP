import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Injectable()
export class BrandService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateBrandDto) {
    return this.prisma.brand.create({
      data: {
        name: dto.name,
      },
    });
  }

  findAll() {
    return this.prisma.brand.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.brand.findUnique({
      where: { id },
    });
  }

  remove(id: string) {
    return this.prisma.brand.delete({
      where: { id },
    });
  }
}