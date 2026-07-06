import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

import { SalesGstService } from './services/sales-gst.service';
import { SalesStockService } from './services/sales-stock.service';
import { SalesSaveService } from './services/sales-save.service';
import { LedgerModule } from '../ledger/ledger.module';

@Module({
  imports: [
    PrismaModule,
    LedgerModule,
  ],

  controllers: [
    SalesController,
  ],

  providers: [
    SalesService,

    SalesGstService,
    SalesStockService,
    SalesSaveService,
  ],
})
export class SalesModule {}