import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SalesModule } from '../sales/sales.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';

import { SalesOrderController } from './sales-order.controller';
import { SalesOrderService } from './sales-order.service';

import { SalesOrderSaveService } from './services/sales-order-save.service';
import { SalesOrderFulfillService } from './services/sales-order-fulfill.service';
import { SalesOrderGstService } from './services/sales-order-gst.service';

@Module({
  imports: [
    PrismaModule,
    SalesModule,
    DocumentNumberModule,
  ],
  controllers: [
    SalesOrderController,
  ],
  providers: [
    SalesOrderService,
    SalesOrderSaveService,
    SalesOrderFulfillService,
    SalesOrderGstService,
  ],
  exports: [
    SalesOrderService,
  ],
})
export class SalesOrderModule {}
