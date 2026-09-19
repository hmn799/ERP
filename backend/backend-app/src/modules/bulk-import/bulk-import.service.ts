import { BadRequestException, Injectable } from "@nestjs/common";

import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";

import { PrismaService } from "../prisma/prisma.service";

import { CategoryService } from "../category/category.service";
import { CreateCategoryDto } from "../category/dto/create-category.dto";

import { BrandService } from "../brand/brand.service";
import { CreateBrandDto } from "../brand/dto/create-brand.dto";

import { UnitService } from "../unit/unit.service";
import { CreateUnitDto } from "../unit/dto/create-unit.dto";

import { WarehouseService } from "../warehouse/warehouse.service";
import { CreateWarehouseDto } from "../warehouse/dto/create-warehouse.dto";

import { GstSlabService } from "../gst-slab/gst-slab.service";
import { CreateGstSlabDto } from "../gst-slab/dto/create-gst-slab.dto";

import { SupplierService } from "../supplier/supplier.service";
import { CreateSupplierDto } from "../supplier/dto/create-supplier.dto";

import { CustomerService } from "../customer/customer.service";
import { CreateCustomerDto } from "../customer/dto/create-customer.dto";

import { ItemService } from "../item/item.service";
import { CreateItemDto } from "../item/dto/create-item.dto";

import { OpeningStockService } from "../opening-stock/opening-stock.service";
import { CreateOpeningStockDto } from "../opening-stock/dto/create-opening-stock.dto";

export interface BulkImportError {
  row: number;
  message: string;
}

export interface BulkImportResult {
  total: number;
  successCount: number;
  errors: BulkImportError[];
}

const IMPORT_ENTITIES = [
  "category",
  "brand",
  "unit",
  "warehouse",
  "gst-slab",
  "supplier",
  "customer",
  "item",
  "opening-stock",
] as const;

type ImportEntity = (typeof IMPORT_ENTITIES)[number];

function text(
  row: Record<string, string>,
  key: string,
): string {
  return (row[key] ?? "").toString().trim();
}

function optionalNumber(
  row: Record<string, string>,
  key: string,
): number | undefined {
  const raw = text(row, key);
  return raw === "" ? undefined : Number(raw);
}

function byNameLower<
  T extends { name: string },
>(list: T[]): Map<string, T> {
  return new Map(
    list.map((item) => [
      item.name.toLowerCase(),
      item,
    ]),
  );
}

@Injectable()
export class BulkImportService {
  constructor(
    private readonly prisma: PrismaService,

    private readonly categoryService: CategoryService,
    private readonly brandService: BrandService,
    private readonly unitService: UnitService,
    private readonly warehouseService: WarehouseService,
    private readonly gstSlabService: GstSlabService,
    private readonly supplierService: SupplierService,
    private readonly customerService: CustomerService,
    private readonly itemService: ItemService,
    private readonly openingStockService: OpeningStockService,
  ) {}

  import(
    entity: string,
    rows: Record<string, string>[],
  ): Promise<BulkImportResult> {
    if (
      !IMPORT_ENTITIES.includes(
        entity as ImportEntity,
      )
    ) {
      throw new BadRequestException(
        `Unknown import type "${entity}".`,
      );
    }

    switch (entity as ImportEntity) {
      case "category":
        return this.importSimple(
          rows,
          CreateCategoryDto,
          (dto) => this.categoryService.create(dto),
          (row) => ({ name: text(row, "Name") }),
        );

      case "brand":
        return this.importSimple(
          rows,
          CreateBrandDto,
          (dto) => this.brandService.create(dto),
          (row) => ({ name: text(row, "Name") }),
        );

      case "warehouse":
        return this.importSimple(
          rows,
          CreateWarehouseDto,
          (dto) => this.warehouseService.create(dto),
          (row) => ({ name: text(row, "Name") }),
        );

      case "unit":
        return this.importSimple(
          rows,
          CreateUnitDto,
          (dto) => this.unitService.create(dto),
          (row) => ({
            name: text(row, "Name"),
            shortName: text(row, "Short Name"),
          }),
        );

      case "gst-slab":
        return this.importSimple(
          rows,
          CreateGstSlabDto,
          (dto) => this.gstSlabService.create(dto),
          (row) => ({
            name: text(row, "Name"),
            percentage: optionalNumber(
              row,
              "Percentage",
            ),
          }),
        );

      case "supplier":
        return this.importSimple(
          rows,
          CreateSupplierDto,
          (dto) => this.supplierService.create(dto),
          (row) => ({
            name: text(row, "Name"),
            gstType:
              text(row, "GST Type") ||
              "Unregistered",
            gstin:
              text(row, "GSTIN") || undefined,
            mobile:
              text(row, "Mobile") || undefined,
            email:
              text(row, "Email") || undefined,
            address:
              text(row, "Address") || undefined,
            city: text(row, "City") || undefined,
            state:
              text(row, "State") || undefined,
            pincode:
              text(row, "Pincode") || undefined,
            openingBalance: optionalNumber(
              row,
              "Opening Balance",
            ),
          }),
        );

      case "customer":
        return this.importSimple(
          rows,
          CreateCustomerDto,
          (dto) => this.customerService.create(dto),
          (row) => {
            const customerGroup = text(
              row,
              "Customer Group",
            ).toUpperCase();

            return {
              name: text(row, "Name"),
              customerGroup,
              gstCategory:
                text(row, "GST Category") ||
                "Unregistered",
              gstin:
                text(row, "GSTIN") || undefined,
              mobile:
                text(row, "Mobile") || undefined,
              email:
                text(row, "Email") || undefined,
              address:
                text(row, "Address") ||
                undefined,
              city:
                text(row, "City") || undefined,
              state:
                text(row, "State") || undefined,
              pincode:
                text(row, "Pincode") ||
                undefined,
              openingBalance: optionalNumber(
                row,
                "Opening Balance",
              ),
              creditLimit: optionalNumber(
                row,
                "Credit Limit",
              ),
            };
          },
        );

      case "item":
        return this.importItems(rows);

      case "opening-stock":
        return this.importOpeningStock(rows);
    }
  }

  /*
   * Shared by every entity with no foreign keys to resolve: build
   * the plain object, validate it against the same DTO class the
   * single-record create endpoint uses, and - only if valid - call
   * that entity's own service.create() so behavior (auto-codes,
   * defaults, transactions) stays identical to adding one record by
   * hand. Rows are processed sequentially, not in parallel, since
   * Item/Customer/Supplier compute their next auto-code from the
   * latest existing row - a parallel batch could race and reuse a
   * number.
   */
  private async importSimple<
    TDto extends object,
  >(
    rows: Record<string, string>[],
    dtoClass: new () => TDto,
    create: (dto: TDto) => Promise<unknown>,
    toPlain: (
      row: Record<string, string>,
    ) => Record<string, unknown>,
  ): Promise<BulkImportResult> {
    const errors: BulkImportError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const rowNumber = i + 2;

      const { dto, messages } =
        await this.validateRow(
          dtoClass,
          toPlain(rows[i]),
        );

      if (messages.length > 0) {
        errors.push({
          row: rowNumber,
          message: messages.join(" "),
        });
        continue;
      }

      try {
        await create(dto);
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          message:
            error instanceof Error
              ? error.message
              : "Failed to save this row.",
        });
      }
    }

    return {
      total: rows.length,
      successCount,
      errors,
    };
  }

  private async importItems(
    rows: Record<string, string>[],
  ): Promise<BulkImportResult> {
    const [
      categories,
      subCategories,
      brands,
      units,
      gstSlabs,
    ] = await Promise.all([
      this.prisma.category.findMany(),
      this.prisma.subCategory.findMany(),
      this.prisma.brand.findMany(),
      this.prisma.unit.findMany(),
      this.prisma.gSTSlab.findMany(),
    ]);

    const categoryMap = byNameLower(categories);
    const subCategoryMap =
      byNameLower(subCategories);
    const brandMap = byNameLower(brands);
    const unitMap = byNameLower(units);
    const gstSlabByName = byNameLower(gstSlabs);

    const gstSlabByPercent = new Map(
      gstSlabs.map((slab) => [
        String(Number(slab.percentage)),
        slab,
      ]),
    );

    const errors: BulkImportError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      const rowErrors: string[] = [];

      const categoryName = text(row, "Category");

      const category = categoryName
        ? categoryMap.get(
            categoryName.toLowerCase(),
          )
        : undefined;

      if (!categoryName) {
        rowErrors.push("Category is required.");
      } else if (!category) {
        rowErrors.push(
          `Category "${categoryName}" not found.`,
        );
      }

      const subCategoryName = text(
        row,
        "Sub Category",
      );

      const subCategory = subCategoryName
        ? subCategoryMap.get(
            subCategoryName.toLowerCase(),
          )
        : undefined;

      if (subCategoryName && !subCategory) {
        rowErrors.push(
          `Sub Category "${subCategoryName}" not found.`,
        );
      }

      const brandName = text(row, "Brand");

      const brand = brandName
        ? brandMap.get(brandName.toLowerCase())
        : undefined;

      if (brandName && !brand) {
        rowErrors.push(
          `Brand "${brandName}" not found.`,
        );
      }

      const gstSlabRaw = text(row, "GST Slab");

      const gstSlab = gstSlabRaw
        ? (gstSlabByName.get(
            gstSlabRaw.toLowerCase(),
          ) ??
          gstSlabByPercent.get(
            String(
              Number(
                gstSlabRaw.replace("%", ""),
              ),
            ),
          ))
        : undefined;

      if (!gstSlabRaw) {
        rowErrors.push("GST Slab is required.");
      } else if (!gstSlab) {
        rowErrors.push(
          `GST Slab "${gstSlabRaw}" not found.`,
        );
      }

      const baseUnitName = text(row, "Base Unit");

      const baseUnit = baseUnitName
        ? unitMap.get(
            baseUnitName.toLowerCase(),
          )
        : undefined;

      if (!baseUnitName) {
        rowErrors.push("Base Unit is required.");
      } else if (!baseUnit) {
        rowErrors.push(
          `Base Unit "${baseUnitName}" not found.`,
        );
      }

      const purchaseUnitName =
        text(row, "Purchase Unit") ||
        baseUnitName;

      const purchaseUnit = purchaseUnitName
        ? unitMap.get(
            purchaseUnitName.toLowerCase(),
          )
        : undefined;

      if (purchaseUnitName && !purchaseUnit) {
        rowErrors.push(
          `Purchase Unit "${purchaseUnitName}" not found.`,
        );
      }

      const saleUnitName =
        text(row, "Sale Unit") || baseUnitName;

      const saleUnit = saleUnitName
        ? unitMap.get(
            saleUnitName.toLowerCase(),
          )
        : undefined;

      if (saleUnitName && !saleUnit) {
        rowErrors.push(
          `Sale Unit "${saleUnitName}" not found.`,
        );
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          message: rowErrors.join(" "),
        });
        continue;
      }

      const { dto, messages } =
        await this.validateRow(CreateItemDto, {
          name: text(row, "Item Name"),
          hsnCode:
            text(row, "HSN Code") || undefined,
          barcode:
            text(row, "Barcode") || undefined,
          categoryId: category!.id,
          subCategoryId: subCategory?.id,
          brandId: brand?.id,
          gstSlabId: gstSlab!.id,
          baseUnitId: baseUnit!.id,
          purchaseUnitId: purchaseUnit!.id,
          saleUnitId: saleUnit!.id,
          mrp: optionalNumber(row, "MRP"),
          purchaseRate: optionalNumber(
            row,
            "Purchase Rate",
          ),
          minQty: optionalNumber(
            row,
            "Min Qty",
          ),
          reorderQty: optionalNumber(
            row,
            "Reorder Qty",
          ),
        });

      if (messages.length > 0) {
        errors.push({
          row: rowNumber,
          message: messages.join(" "),
        });
        continue;
      }

      try {
        await this.itemService.create(dto);
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          message:
            error instanceof Error
              ? error.message
              : "Failed to save this item.",
        });
      }
    }

    return {
      total: rows.length,
      successCount,
      errors,
    };
  }

  private async importOpeningStock(
    rows: Record<string, string>[],
  ): Promise<BulkImportResult> {
    const [items, warehouses] = await Promise.all([
      this.prisma.item.findMany({
        select: { id: true, itemCode: true, name: true },
      }),
      this.prisma.warehouse.findMany(),
    ]);

    const itemByCode = new Map(
      items.map((item) => [
        item.itemCode.toLowerCase(),
        item,
      ]),
    );
    const itemByName = new Map(
      items.map((item) => [
        item.name.toLowerCase(),
        item,
      ]),
    );
    const warehouseMap = byNameLower(warehouses);

    const errors: BulkImportError[] = [];
    let successCount = 0;

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const rowNumber = i + 2;
      const rowErrors: string[] = [];

      const itemRaw = text(row, "Item");

      const item = itemRaw
        ? (itemByCode.get(itemRaw.toLowerCase()) ??
          itemByName.get(itemRaw.toLowerCase()))
        : undefined;

      if (!itemRaw) {
        rowErrors.push("Item is required.");
      } else if (!item) {
        rowErrors.push(`Item "${itemRaw}" not found.`);
      }

      const warehouseName = text(row, "Warehouse");

      const warehouse = warehouseName
        ? warehouseMap.get(warehouseName.toLowerCase())
        : undefined;

      if (!warehouseName) {
        rowErrors.push("Warehouse is required.");
      } else if (!warehouse) {
        rowErrors.push(
          `Warehouse "${warehouseName}" not found.`,
        );
      }

      if (rowErrors.length > 0) {
        errors.push({
          row: rowNumber,
          message: rowErrors.join(" "),
        });
        continue;
      }

      const { dto, messages } = await this.validateRow(
        CreateOpeningStockDto,
        {
          itemId: item!.id,
          warehouseId: warehouse!.id,
          qty: optionalNumber(row, "Qty"),
          purchaseRate: optionalNumber(row, "Purchase Rate"),
          retailRate: optionalNumber(row, "Retail Rate"),
          wholesaleRate: optionalNumber(row, "Wholesale Rate"),
          distributorRate: optionalNumber(
            row,
            "Distributor Rate",
          ),
          mrp: optionalNumber(row, "MRP"),
          expiryDate: text(row, "Expiry Date") || undefined,
          manufacturingDate:
            text(row, "Manufacturing Date") || undefined,
          transactionDate: text(row, "Date") || undefined,
          remarks: text(row, "Remarks") || undefined,
        },
      );

      if (messages.length > 0) {
        errors.push({
          row: rowNumber,
          message: messages.join(" "),
        });
        continue;
      }

      try {
        await this.openingStockService.create(dto);
        successCount++;
      } catch (error) {
        errors.push({
          row: rowNumber,
          message:
            error instanceof Error
              ? error.message
              : "Failed to save this row.",
        });
      }
    }

    return {
      total: rows.length,
      successCount,
      errors,
    };
  }

  private async validateRow<TDto extends object>(
    dtoClass: new () => TDto,
    plain: Record<string, unknown>,
  ): Promise<{
    dto: TDto;
    messages: string[];
  }> {
    const dto = plainToInstance(
      dtoClass,
      plain,
      { enableImplicitConversion: true },
    );

    const violations = await validate(
      dto as object,
      { whitelist: true },
    );

    const messages = violations.flatMap(
      (violation) =>
        Object.values(
          violation.constraints ?? {},
        ),
    );

    return { dto, messages };
  }
}
