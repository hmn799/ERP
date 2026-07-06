import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateRouteDto } from './dto/create-route.dto';

@Injectable()
export class RouteService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateRouteDto) {
    return this.prisma.route.create({
      data: {
        name: dto.name,
      },
    });
  }

  async findAll() {
    return this.prisma.route.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  async findOne(id: string) {
    return this.prisma.route.findUnique({
      where: {
        id,
      },
    });
  }

  async delete(id: string) {
    return this.prisma.route.delete({
      where: {
        id,
      },
    });
  }
}