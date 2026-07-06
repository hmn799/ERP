import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { PurchaseReturnService } from './purchase-return.service';

import { CreatePurchaseReturnDto } from './dto/create-purchase-return.dto';

@Controller('purchase-returns')
export class PurchaseReturnController {
  constructor(
    private readonly purchaseReturnService: PurchaseReturnService,
  ) {}

  @Post()
  create(
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchaseReturnService.create(dto);
  }

  @Get()
  findAll() {
    return this.purchaseReturnService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.purchaseReturnService.findOne(id);
  }
}