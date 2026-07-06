import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { PurchaseService } from './purchase.service';

import { CreatePurchaseDto } from './dto/create-purchase.dto';

@Controller('purchases')
export class PurchaseController {
  constructor(
    private readonly purchaseService: PurchaseService,
  ) {}

  @Post()
  create(
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchaseService.create(dto);
  }

  @Get()
  findAll() {
    return this.purchaseService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.purchaseService.findOne(id);
  }
}