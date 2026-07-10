import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { PriceListService } from "./price-list.service";
import { CreatePriceListDto } from "./dto/create-price-list.dto";
import { UpdatePriceListDto } from "./dto/update-price-list.dto";

@Controller("price-lists")
export class PriceListController {
  constructor(
    private readonly priceListService: PriceListService,
  ) {}

  @Post()
  create(
    @Body() dto: CreatePriceListDto,
  ) {
    return this.priceListService.create(dto);
  }

  @Get()
  findAll() {
    return this.priceListService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.priceListService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdatePriceListDto,
  ) {
    return this.priceListService.update(id, dto);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
  ) {
    return this.priceListService.remove(id);
  }
}