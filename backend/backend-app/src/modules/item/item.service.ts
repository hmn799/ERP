import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { CreateItemDto } from './dto/create-item.dto';

@Injectable()
export class ItemService {
  constructor(
    private prisma: PrismaService,
  ) {}

  create(dto: CreateItemDto) {
  console.log('ITEM DTO =>', dto);

  return this.prisma.item.create({
    data: {
      itemCode: dto.itemCode,
      name: dto.name,

      hsnCode: dto.hsnCode,
      barcode: dto.barcode,

      categoryId: dto.categoryId,
      subCategoryId: dto.subCategoryId,

      brandId: dto.brandId,

      gstSlabId: dto.gstSlabId,

      baseUnitId: dto.baseUnitId,
      purchaseUnitId: dto.purchaseUnitId,
      saleUnitId: dto.saleUnitId,

      conversionFactor: dto.conversionFactor,

      mrp: dto.mrp,
      purchaseRate: dto.purchaseRate,
    },
  });
}

  findAll() {
    return this.prisma.item.findMany({
      include: {
        category: true,
        subCategory: true,
        brand: true,
        gstSlab: true,
        baseUnit: true,
        purchaseUnit: true,
        saleUnit: true,
      },
      orderBy: {
        name: 'asc',
      },
    });
  }

  findOne(id: string) {
    return this.prisma.item.findUnique({
      where: { id },
      include: {
        category: true,
        subCategory: true,
        brand: true,
        gstSlab: true,
        baseUnit: true,
        purchaseUnit: true,
        saleUnit: true,
      },
    });
  }

  remove(id: string) {
    return this.prisma.item.delete({
      where: { id },
    });
  }
}