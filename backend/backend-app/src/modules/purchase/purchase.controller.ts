import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
} from "@nestjs/common";

import { PurchaseService } from "./purchase.service";

import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { PurchaseListQueryDto } from "./dto/purchase-list-query.dto";

@Controller("purchases")
export class PurchaseController {
  constructor(
    private readonly purchaseService:
      PurchaseService,
  ) {}

  @Post()
  create(
    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchaseService.create(
      dto,
    );
  }

  @Put(":id")
  update(
    @Param("id") id: string,

    @Body() dto: CreatePurchaseDto,
  ) {
    return this.purchaseService.update(
      id,
      dto,
    );
  }

  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
  ) {
    return this.purchaseService.cancel(
      id,
    );
  }

  @Get()
  findAll(
    @Query() query: PurchaseListQueryDto,
  ) {
    return this.purchaseService.findAll(
      query,
    );
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.purchaseService.findOne(
      id,
    );
  }
}