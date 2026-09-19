import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { BatchModule } from "../batch/batch.module";
import { WarehouseModule } from "../warehouse/warehouse.module";

import { OpeningStockController } from "./opening-stock.controller";
import { OpeningStockService } from "./opening-stock.service";

@Module({
  imports: [PrismaModule, BatchModule, WarehouseModule],
  controllers: [OpeningStockController],
  providers: [OpeningStockService],
  exports: [OpeningStockService],
})
export class OpeningStockModule {}
