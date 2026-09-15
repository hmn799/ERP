import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";

import { PurchaseReturnService } from "./purchase-return.service";

import { CreatePurchaseReturnDto } from "./dto/create-purchase-return.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("DELETE_PURCHASE")
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