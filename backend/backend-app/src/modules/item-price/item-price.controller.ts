import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { ItemPriceService } from './item-price.service';
import { CreateItemPriceDto } from './dto/create-item-price.dto';
import { UpdateItemPriceDto } from './dto/update-item-price.dto';

@Controller('item-price')
export class ItemPriceController {
  constructor(
    private readonly itemPriceService: ItemPriceService,
  ) {}

  @Post()
  create(
    @Body() createItemPriceDto: CreateItemPriceDto,
  ) {
    return this.itemPriceService.create(createItemPriceDto);
  }

  @Get()
  findAll() {
    return this.itemPriceService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.itemPriceService.findOne(id);
  }

  @Get('item/:itemId')
  findByItem(
    @Param('itemId') itemId: string,
  ) {
    return this.itemPriceService.findByItem(itemId);
  }

  @Get('price-list/:priceListId')
  findByPriceList(
    @Param('priceListId') priceListId: string,
  ) {
    return this.itemPriceService.findByPriceList(priceListId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateItemPriceDto: UpdateItemPriceDto,
  ) {
    return this.itemPriceService.update(
      id,
      updateItemPriceDto,
    );
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.itemPriceService.remove(id);
  }
}