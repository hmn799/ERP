import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';

import { SaleReturnController } from './sale-return.controller';
import { SaleReturnService } from './sale-return.service';

@Module({
  imports: [
    PrismaModule,
    LedgerModule,
    DocumentNumberModule,
  ],

  controllers: [
    SaleReturnController,
  ],

  providers: [
    SaleReturnService,
  ],
})
export class SaleReturnModule {}
