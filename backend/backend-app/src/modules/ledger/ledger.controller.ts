import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { LedgerService } from './ledger.service';

import { CreateReceiptDto } from './dto/create-receipt.dto';
import { CreatePaymentDto } from './dto/create-payment.dto';

@Controller('ledger')
export class LedgerController {
  constructor(
    private readonly ledgerService: LedgerService,
  ) {}

  @Post('receipt')
  receipt(
    @Body() dto: CreateReceiptDto,
  ) {
    return this.ledgerService.createReceipt(dto);
  }

  @Post('payment')
  payment(
    @Body() dto: CreatePaymentDto,
  ) {
    return this.ledgerService.createPayment(dto);
  }

  @Get('customer/:id')
  customerLedger(
    @Param('id') id: string,
  ) {
    return this.ledgerService.customerLedger(id);
  }

  @Get('supplier/:id')
  supplierLedger(
    @Param('id') id: string,
  ) {
    return this.ledgerService.supplierLedger(id);
  }

  @Get('customer/:id/outstanding')
  customerOutstanding(
    @Param('id') id: string,
  ) {
    return this.ledgerService.customerOutstanding(id);
  }

  @Get('supplier/:id/outstanding')
  supplierOutstanding(
    @Param('id') id: string,
  ) {
    return this.ledgerService.supplierOutstanding(id);
  }
}