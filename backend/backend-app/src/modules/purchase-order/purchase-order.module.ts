import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { PurchaseModule } from '../purchase/purchase.module';
import { LedgerModule } from '../ledger/ledger.module';

import { PurchaseOrderController } from './purchase-order.controller';
import { PurchaseOrderService } from './purchase-order.service';

import { PurchaseOrderSaveService } from './services/purchase-order-save.service';
import { PurchaseOrderReceiveService } from './services/purchase-order-receive.service';
import { PurchaseOrderGstService } from './services/purchase-order-gst.service';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';

@Module({
  imports: [
    PrismaModule,
    PurchaseModule,
    LedgerModule,
     DocumentNumberModule,
  ],
  controllers: [
    PurchaseOrderController,
  ],
  providers: [
    PurchaseOrderService,
    PurchaseOrderSaveService,
    PurchaseOrderReceiveService,
    PurchaseOrderGstService,
  ],
  exports: [
    PurchaseOrderService,
  ],
})
export class PurchaseOrderModule {}