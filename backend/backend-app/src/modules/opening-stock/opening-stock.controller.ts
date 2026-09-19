import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";

import { OpeningStockService } from "./opening-stock.service";
import { CreateOpeningStockDto } from "./dto/create-opening-stock.dto";
import { BulkOpeningStockDto } from "./dto/bulk-opening-stock.dto";

@Controller("opening-stock")
export class OpeningStockController {
  constructor(private readonly openingStockService: OpeningStockService) {}

  @Get()
  list() {
    return this.openingStockService.list();
  }

  @Post()
  create(@Body() dto: CreateOpeningStockDto) {
    return this.openingStockService.create(dto);
  }

  @Post("bulk")
  bulkCreate(@Body() dto: BulkOpeningStockDto) {
    return this.openingStockService.bulkCreate(dto.rows);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.openingStockService.remove(id);
  }
}
