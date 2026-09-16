import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { BankAccountController } from './bank-account.controller';
import { BankAccountService } from './bank-account.service';
import { BankReconciliationController } from './bank-reconciliation.controller';
import { BankReconciliationService } from './bank-reconciliation.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    BankAccountController,
    BankReconciliationController,
  ],
  providers: [BankAccountService, BankReconciliationService],
  exports: [BankAccountService],
})
export class BankModule {}
