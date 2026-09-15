import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { PurchaseReturnService } from "./purchase-return.service";

import { CreatePurchaseReturnDto } from "./dto/create-purchase-return.dto";

@Controller("purchase-returns")
export class PurchaseReturnController {
  constructor(
    private readonly purchaseReturnService: PurchaseReturnService,
  ) {}

  // =========================================================
  // CREATE
  // =========================================================

  @Post()
  create(
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchaseReturnService.create(
      dto,
    );
  }

  // =========================================================
  // LIST
  // =========================================================

  @Get()
  findAll() {
    return this.purchaseReturnService.findAll();
  }

  // =========================================================
  // PURCHASE BILL FOR RETURN
  // =========================================================

  @Get("purchase-bill/:purchaseBillId")
  findByPurchaseBill(
    @Param("purchaseBillId")
    purchaseBillId: string,
  ) {
    return this.purchaseReturnService.findByPurchaseBill(
      purchaseBillId,
    );
  }

  // =========================================================
  // EDIT
  // =========================================================

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: CreatePurchaseReturnDto,
  ) {
    return this.purchaseReturnService.update(
      id,
      dto,
    );
  }

  // =========================================================
  // CANCEL
  // =========================================================

  @Post(":id/cancel")
  cancel(
    @Param("id") id: string,
  ) {
    return this.purchaseReturnService.cancel(
      id,
    );
  }

  // =========================================================
  // GET ONE
  // =========================================================

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.purchaseReturnService.findOne(
      id,
    );
  }
}