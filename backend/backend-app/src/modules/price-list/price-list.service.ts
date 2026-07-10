import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreatePriceListDto } from "./dto/create-price-list.dto";
import { UpdatePriceListDto } from "./dto/update-price-list.dto";

@Injectable()
export class PriceListService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreatePriceListDto) {
    return this.prisma.priceList.create({
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
    });
  }

  findAll() {
    return this.prisma.priceList.findMany({
      orderBy: {
        priority: "asc",
      },
    });
  }

  findOne(id: string) {
    return this.prisma.priceList.findUnique({
      where: { id },
    });
  }

  update(
    id: string,
    dto: UpdatePriceListDto,
  ) {
    return this.prisma.priceList.update({
      where: { id },
      data: {
        code: dto.code,
        name: dto.name,
        description: dto.description,
        priority: dto.priority,
        isDefault: dto.isDefault,
        isActive: dto.isActive,
      },
    });
  }

  remove(id: string) {
    return this.prisma.priceList.delete({
      where: { id },
    });
  }
}