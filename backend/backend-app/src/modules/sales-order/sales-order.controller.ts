import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { SalesOrderService } from './sales-order.service';

import { CreateSalesOrderDto } from './dto/create-sales-order.dto';
import { FulfillSalesOrderDto } from './dto/fulfill-sales-order.dto';

import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('sales-order')
export class SalesOrderController {
  constructor(
    private readonly salesOrderService: SalesOrderService,
  ) {}

  @Post()
  create(@Body() dto: CreateSalesOrderDto) {
    return this.salesOrderService.create(dto);
  }

  @Get()
  findAll() {
    return this.salesOrderService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.salesOrderService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.salesOrderService.cancel(id);
  }

  @Post(':id/fulfill')
  @UseGuards(OptionalJwtAuthGuard)
  fulfill(
    @Param('id') id: string,
    @Body() dto: FulfillSalesOrderDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.salesOrderService.fulfill(
      id,
      dto,
      user?.permissions,
      user
        ? { id: user.sub, name: user.fullName || user.username }
        : undefined,
    );
  }
}
