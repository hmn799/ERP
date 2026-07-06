import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { PriceListService } from './price-list.service';
import { CreatePriceListDto } from './dto/create-price-list.dto';
import { UpdatePriceListDto } from './dto/update-price-list.dto';

@Controller('price-list')
export class PriceListController {
  constructor(private readonly priceListService: PriceListService) {}

  @Post()
  create(@Body() createPriceListDto: CreatePriceListDto) {
    return this.priceListService.create(createPriceListDto);
  }

  @Get()
  findAll() {
    return this.priceListService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.priceListService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updatePriceListDto: UpdatePriceListDto) {
    return this.priceListService.update(+id, updatePriceListDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.priceListService.remove(+id);
  }
}
