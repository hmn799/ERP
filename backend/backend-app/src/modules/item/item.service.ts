import {
  Injectable,
  NotFoundException,
} from "@nestjs/common";

import { Item, Prisma } from "@prisma/client";

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

    return this.prisma.$transaction(async (tx) => {
      const item = await tx.item.create({
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

          mrp: dto.mrp,

          purchaseRate: dto.purchaseRate,

          minQty: dto.minQty ?? 0,

          reorderQty: dto.reorderQty ?? 0,

          isActive: dto.isActive ?? true,

          isGeneralItem: dto.isGeneralItem ?? false,
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

      if (dto.isGeneralItem) {
        await this.createPlaceholderBatch(item, tx);
      }

      return item;
    });
  }

  /*
   * A general item is never purchased, so it has no batch of its
   * own from the normal purchase flow - this stands in for one so
   * it can be added to a sale immediately. Rates are all 0; the
   * operator types the actual price on the bill itself.
   */
  private createPlaceholderBatch(
    item: Item,
    tx: Prisma.TransactionClient,
  ) {
    return tx.batch.create({
      data: {
        batchNo: `GEN-${item.itemCode}`,
        itemId: item.id,
        purchaseRate: item.purchaseRate,
        retailRate: 0,
        wholesaleRate: 0,
        distributorRate: 0,
        mrp: item.mrp,
        status: "ACTIVE",
        creationReason: "GENERAL_ITEM",
        isActive: true,
      },
    });
  }

  async findAll() {
    const [items, supplierMap] = await Promise.all([
      this.prisma.item.findMany({
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
      }),
      this.getItemSupplierMap(),
    ]);

    return items.map((item) => ({
      ...item,
      distributors: supplierMap.get(item.id) ?? [],
    }));
  }

  /*
   * Which suppliers an item has actually been bought from, derived
   * from purchase history rather than a manually-maintained mapping -
   * an item bought from two different distributors (same item,
   * different sticker/rate) naturally accumulates both here without
   * any extra data entry. Powers the Item Master "Distributor" filter.
   */
  private async getItemSupplierMap() {
    const links = await this.prisma.purchaseBillItem.findMany({
      select: {
        itemId: true,
        purchaseBill: {
          select: {
            supplier: { select: { id: true, name: true } },
          },
        },
      },
    });

    const map = new Map<
      string,
      Map<string, { id: string; name: string }>
    >();

    for (const link of links) {
      const supplier = link.purchaseBill.supplier;

      if (!map.has(link.itemId)) {
        map.set(link.itemId, new Map());
      }

      map.get(link.itemId)!.set(supplier.id, supplier);
    }

    const result = new Map<
      string,
      { id: string; name: string }[]
    >();

    for (const [itemId, suppliers] of map) {
      result.set(itemId, Array.from(suppliers.values()));
    }

    return result;
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

  /*
   * Read-only combined view for the item edit dialog: the item's own
   * single barcode field plus every barcode (primary or alternate)
   * recorded against any of its active batches. Actual add/remove/
   * set-primary happens per-batch via the batch barcode endpoints,
   * since a barcode is really tied to a specific purchase lot.
   */
  async getBarcodes(id: string) {
    const item = await this.prisma.item.findUnique({
      where: { id },
      select: {
        barcode: true,
        batches: {
          where: { isActive: true },
          orderBy: { createdAt: "desc" },
          select: {
            id: true,
            batchNo: true,
            barcodes: {
              select: { id: true, barcode: true, isPrimary: true },
              orderBy: { isPrimary: "desc" },
            },
          },
        },
      },
    });

    if (!item) {
      throw new NotFoundException("Item not found.");
    }

    return {
      itemBarcode: item.barcode,
      batches: item.batches.map((batch) => ({
        batchId: batch.id,
        batchNo: batch.batchNo,
        barcodes: batch.barcodes,
      })),
    };
  }

  async update(
    id: string,
    dto: UpdateItemDto,
  ) {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.item.update({
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

          mrp: dto.mrp,

          purchaseRate: dto.purchaseRate,

          minQty: dto.minQty,

          reorderQty: dto.reorderQty,

          isActive: dto.isActive,

          isGeneralItem: dto.isGeneralItem,
        },
      });

      if (dto.isGeneralItem) {
        const hasBatch = await tx.batch.findFirst({
          where: { itemId: item.id },
          select: { id: true },
        });

        if (!hasBatch) {
          await this.createPlaceholderBatch(item, tx);
        }
      }

      return tx.item.findUniqueOrThrow({
        where: { id: item.id },
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

      isGeneralItem: true,

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

      // Not limited to the latest batch here (unlike the pricing
      // lookup below) because every active batch's barcodes -
      // primary or alternate - need to be searchable, not just the
      // most recent one's.
      batches: {
        where: {
          isActive: true,
        },

        orderBy: {
          createdAt: "desc",
        },

        select: {
          retailRate: true,

          wholesaleRate: true,

          distributorRate: true,

          barcodes: {
            select: { barcode: true },
          },
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

    isGeneralItem: item.isGeneralItem,

    // Every barcode ever recorded against any active batch of this
    // item (primary or alternate) - a batch accumulates more than
    // one when the same stock gets re-scanned under a different
    // label. Searched alongside the item's own `barcode` field so a
    // previously-seen alternate barcode is still found by search.
    alternateBarcodes: Array.from(
      new Set(
        item.batches.flatMap((batch) =>
          batch.barcodes.map((b) => b.barcode),
        ),
      ),
    ).filter((code) => code !== item.barcode),

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
