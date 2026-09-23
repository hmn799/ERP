import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { StockDamageService } from './stock-damage.service';
import { CreateStockDamageDto } from './dto/create-stock-damage.dto';

@Controller('stock-damage')
export class StockDamageController {
  constructor(
    private readonly stockDamageService: StockDamageService,
  ) {}

  @Post()
  create(@Body() dto: CreateStockDamageDto) {
    return this.stockDamageService.create(dto);
  }

  @Get()
  findAll() {
    return this.stockDamageService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.stockDamageService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.stockDamageService.cancel(id);
  }
}
