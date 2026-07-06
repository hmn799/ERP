import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SalesService } from './sales.service';

import { CreateSalesDto } from './dto/create-sales.dto';

@Controller('sales')
export class SalesController {
  constructor(
    private readonly salesService: SalesService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateSalesDto,
  ) {
    return this.salesService.create(dto);
  }

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(id);
  }
}