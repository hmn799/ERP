import { Module } from '@nestjs/common';

import { PurchaseController } from './purchase.controller';
import { PurchaseService } from './purchase.service';

import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { BatchModule } from '../batch/batch.module';
import { WarehouseModule } from '../warehouse/warehouse.module';

import { PurchaseSaveService } from './services/purchase-save.service';
import { PurchaseStockService } from './services/purchase-stock.service';
import { PurchaseGstService } from './services/purchase-gst.service';

import { DocumentNumberModule } from '../../core/document-number/document-number.module';
import { InventoryReversalService } from './services/inventory-reversal.service';
import { PurchaseEditService } from './services/purchase-edit.service';
@Module({
  imports: [
    PrismaModule,
    LedgerModule,
    DocumentNumberModule,
    BatchModule,
    WarehouseModule,
  ],

  controllers: [
    PurchaseController,
  ],

  providers: [
    PurchaseService,
    PurchaseSaveService,
    PurchaseStockService,
    PurchaseGstService,
    InventoryReversalService,
     PurchaseEditService,
  ],

  exports: [
    PurchaseSaveService,
  ],
})
export class PurchaseModule {}