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

  async lookup() {
  const items = await this.prisma.item.findMany({
    where: {
      isActive: true,
    },

    select: {
      id: true,

      itemCode: true,

      name: true,

      barcode: true,

      purchaseRate: true,

      mrp: true,

      gstSlab: {
        select: {
          percentage: true,
        },
      },

      baseUnit: {
        select: {
          name: true,
        },
      },

      batches: {
        where: {
          isActive: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        take: 1,

        select: {
          retailRate: true,

          wholesaleRate: true,

          distributorRate: true,
        },
      },
    },

    orderBy: {
      name: "asc",
    },
  });

  return items.map((item) => ({
    id: item.id,

    itemCode: item.itemCode,

    name: item.name,

    barcode: item.barcode,

    purchaseRate: Number(item.purchaseRate),

    retailRate: Number(
      item.batches[0]?.retailRate ?? 0,
    ),

    wholesaleRate: Number(
      item.batches[0]?.wholesaleRate ?? 0,
    ),

    distributorRate: Number(
      item.batches[0]?.distributorRate ?? 0,
    ),

    mrp: Number(item.mrp),

    gstPercent: Number(
      item.gstSlab?.percentage ?? 0,
    ),

    unit: item.baseUnit?.name ?? "",
  }));
}
}
