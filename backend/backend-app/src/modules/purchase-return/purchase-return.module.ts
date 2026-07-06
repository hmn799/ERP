import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { LedgerModule } from '../ledger/ledger.module';

import { PurchaseReturnController } from './purchase-return.controller';
import { PurchaseReturnService } from './purchase-return.service';

@Module({
  imports: [
    PrismaModule,
    LedgerModule,
  ],

  controllers: [
    PurchaseReturnController,
  ],

  providers: [
    PurchaseReturnService,
  ],
})
export class PurchaseReturnModule {}