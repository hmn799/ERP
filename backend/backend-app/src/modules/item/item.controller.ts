import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { ItemService } from './item.service';
import { CreateItemDto } from './dto/create-item.dto';

@Controller('items')
export class ItemController {
  constructor(
    private readonly itemService: ItemService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateItemDto,
  ) {
    return this.itemService.create(dto);
  }

  @Get()
  findAll() {
    return this.itemService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.itemService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.itemService.remove(id);
  }
}