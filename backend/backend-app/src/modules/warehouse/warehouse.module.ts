import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { WarehouseController } from './warehouse.controller';
import { WarehouseService } from './warehouse.service';

import { WarehouseStockService } from './services/warehouse-stock.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    WarehouseController,
  ],

  providers: [
    WarehouseService,
    WarehouseStockService,
  ],

  exports: [
    WarehouseStockService,
    WarehouseService,
  ],
})
export class WarehouseModule {}