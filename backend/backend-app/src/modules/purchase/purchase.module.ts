import { Module } from '@nestjs/common';

import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

import { PurchaseSaveService } from './services/purchase-save.service';
import { PurchaseStockService } from './services/purchase-stock.service';
import { PurchaseGstService } from './services/purchase-gst.service';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';

@Module({
  imports: [
    PrismaModule,
    LedgerModule,
     DocumentNumberModule,
  ],

  controllers: [
    PurchaseController,
  ],

  providers: [
    PurchaseService,
    PurchaseSaveService,
    PurchaseStockService,
    PurchaseGstService,
  ],

  exports: [
    PurchaseSaveService,
  ],
})
export class PurchaseModule {}