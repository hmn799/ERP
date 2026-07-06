import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateGstSlabDto } from './dto/create-gst-slab.dto';

@Injectable()
export class GstSlabService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateGstSlabDto) {
    return this.prisma.gSTSlab.create({
      data: {
        name: dto.name,
        percentage: dto.percentage,
      },
    });
  }

  findAll() {
    return this.prisma.gSTSlab.findMany({
      orderBy: {
        percentage: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.gSTSlab.findUnique({
      where: { id },
    });
  }

  remove(id: string) {
    return this.prisma.gSTSlab.delete({
      where: { id },
    });
  }
}