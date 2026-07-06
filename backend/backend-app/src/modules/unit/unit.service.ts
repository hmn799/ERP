import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateUnitDto } from './dto/create-unit.dto';
import { UpdateUnitDto } from './dto/update-unit.dto';

@Injectable()
export class UnitService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateUnitDto) {
  return this.prisma.unit.create({
    data: {
      name: dto.name,
      shortName: dto.shortName,
    },
  });
}

  findAll() {
    return this.prisma.unit.findMany({
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.unit.findUnique({
      where: { id },
    });
  }
update(
  id: string,
  dto: UpdateUnitDto,
) {
  return this.prisma.unit.update({
    where: { id },
    data: {
      name: dto.name,
      shortName: dto.shortName,
    },
  });
}
  remove(id: string) {
    return this.prisma.unit.delete({
      where: { id },
    });
  }
}