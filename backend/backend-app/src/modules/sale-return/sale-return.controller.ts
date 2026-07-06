import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SaleReturnService } from './sale-return.service';

import { CreateSaleReturnDto } from './dto/create-sale-return.dto';

@Controller('sale-returns')
export class SaleReturnController {
  constructor(
    private readonly saleReturnService: SaleReturnService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateSaleReturnDto,
  ) {
    return this.saleReturnService.create(dto);
  }

  @Get()
  findAll() {
    return this.saleReturnService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.saleReturnService.findOne(id);
  }
}