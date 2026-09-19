import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from "@nestjs/common";

import { ItemService } from "./item.service";

import { CreateItemDto } from "./dto/create-item.dto";
import { UpdateItemDto } from "./dto/update-item.dto";

@Controller("items")
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

  @Get("lookup")
lookup() {
  return this.itemService.lookup();
}

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.itemService.findOne(id);
  }

  @Get(":id/barcodes")
  getBarcodes(
    @Param("id") id: string,
  ) {
    return this.itemService.getBarcodes(id);
  }

  @Patch(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateItemDto,
  ) {
    return this.itemService.update(id, dto);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
  ) {
    return this.itemService.remove(id);
  }
}