import { Module } from '@nestjs/common';
import { StockLedgerController } from './stock-ledger.controller';
import { StockLedgerService } from './stock-ledger.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [StockLedgerController],
  providers: [StockLedgerService],
})
export class StockLedgerModule {}