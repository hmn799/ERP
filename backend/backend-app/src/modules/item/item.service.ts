import { Injectable } from "@nestjs/common";

import { PrismaService } from "../prisma/prisma.service";

import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";

@Injectable()
export class ItemService {
  constructor(
    private prisma: PrismaService,
  ) {}

  async create(dto: CreateItemDto) {
    const lastItem = await this.prisma.item.findFirst({
      orderBy: {
        createdAt: "desc",
      },
    });

    let nextNumber = 1;

    if (lastItem?.itemCode) {
      const numericPart = parseInt(
        lastItem.itemCode.replace("ITEM", ""),
        10,
      );

      if (!Number.isNaN(numericPart)) {
        nextNumber = numericPart + 1;
      }
    }

    const itemCode = `ITEM${nextNumber
      .toString()
      .padStart(5, "0")}`;

    return this.prisma.item.create({
      data: {
        itemCode,

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

        isActive: dto.isActive ?? true,
      },

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
        name: "asc",
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

  update(
    id: string,
    dto: UpdateItemDto,
  ) {
    return this.prisma.item.update({
      where: { id },

      data: {
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

        isActive: dto.isActive,
      },

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