import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";

import { CategoryModule } from "../category/category.module";
import { BrandModule } from "../brand/brand.module";
import { UnitModule } from "../unit/unit.module";
import { WarehouseModule } from "../warehouse/warehouse.module";
import { GstSlabModule } from "../gst-slab/gst-slab.module";
import { SupplierModule } from "../supplier/supplier.module";
import { CustomerModule } from "../customer/customer.module";
import { ItemModule } from "../item/item.module";

import { BulkImportController } from "./bulk-import.controller";
import { BulkImportService } from "./bulk-import.service";

@Module({
  imports: [
    PrismaModule,
    CategoryModule,
    BrandModule,
    UnitModule,
    WarehouseModule,
    GstSlabModule,
    SupplierModule,
    CustomerModule,
    ItemModule,
  ],

  controllers: [BulkImportController],

  providers: [BulkImportService],
})
export class BulkImportModule {}
