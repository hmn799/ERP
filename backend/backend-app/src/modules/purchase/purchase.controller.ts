import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";

import { PurchaseService } from "./purchase.service";

import { CreatePurchaseDto } from "./dto/create-purchase.dto";
import { PurchaseListQueryDto } from "./dto/purchase-list-query.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";
import { CurrentUser } from "../auth/decorators/current-user.decorator";
import type { AuthUser } from "../auth/types/auth-user.type";

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
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("DELETE_PURCHASE")
  cancel(
    @Param("id") id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.purchaseService.cancel(
      id,
      { id: user.sub, name: user.fullName || user.username },
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