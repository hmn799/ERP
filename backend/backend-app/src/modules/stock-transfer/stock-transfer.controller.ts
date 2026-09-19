import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from "@nestjs/common";

import { StockTransferService } from "./stock-transfer.service";
import { CreateStockTransferDto } from "./dto/create-stock-transfer.dto";

@Controller("stock-transfers")
export class StockTransferController {
  constructor(
    private readonly stockTransferService: StockTransferService,
  ) {}

  @Post()
  create(@Body() dto: CreateStockTransferDto) {
    return this.stockTransferService.create(dto);
  }

  @Get()
  findAll() {
    return this.stockTransferService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.stockTransferService.findOne(id);
  }

  @Delete(":id")
  remove(@Param("id") id: string) {
    return this.stockTransferService.remove(id);
  }
}
