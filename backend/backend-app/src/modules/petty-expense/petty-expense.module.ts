import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';
import { LedgerModule } from '../ledger/ledger.module';

import { PettyExpenseController } from './petty-expense.controller';
import { PettyExpenseService } from './petty-expense.service';

@Module({
  imports: [
    PrismaModule,
    DocumentNumberModule,
    LedgerModule,
  ],

  controllers: [
    PettyExpenseController,
  ],

  providers: [
    PettyExpenseService,
  ],

  exports: [
    PettyExpenseService,
  ],
})
export class PettyExpenseModule {}
