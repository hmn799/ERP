import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';
import { SchemeModule } from '../scheme/scheme.module';
import { PdfModule } from '../../core/pdf/pdf.module';
import { CompanyModule } from '../company/company.module';

import { SalesController } from './sales.controller';
import { SalesService } from './sales.service';

import { SalesGstService } from './services/sales-gst.service';
import { SalesStockService } from './services/sales-stock.service';
import { SalesSaveService } from './services/sales-save.service';
import { SalesReversalService } from './services/sales-reversal.service';
import { SalesCalculationService } from './services/sales-calculation.service';
import { SalesUpdateService } from './services/sales-update.service';
import { HeldSaleService } from './services/held-sale.service';

@Module({
  imports: [
    PrismaModule,
    LedgerModule,
    DocumentNumberModule,
    SchemeModule,
    PdfModule,
    CompanyModule,
  ],

  controllers: [
    SalesController,
  ],

  providers: [
    SalesService,

    SalesGstService,
    SalesStockService,
    SalesSaveService,
    SalesReversalService,
    SalesCalculationService,
    SalesUpdateService,
    HeldSaleService,
  ],

  exports: [
    SalesService,
    SalesStockService,
  ],
})
export class SalesModule {}
