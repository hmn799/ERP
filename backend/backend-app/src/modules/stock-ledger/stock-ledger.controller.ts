import { Controller, Get, Param } from '@nestjs/common';
import { StockLedgerService } from './stock-ledger.service';

@Controller('stock-ledgers')
export class StockLedgerController {
  constructor(
    private readonly stockLedgerService: StockLedgerService,
  ) {}

  @Get()
  findAll() {
    return this.stockLedgerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockLedgerService.findOne(id);
  }
}