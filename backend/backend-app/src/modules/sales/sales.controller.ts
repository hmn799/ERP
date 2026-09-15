import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { SalesService } from './sales.service';

import { CreateSalesDto } from './dto/create-sales.dto';

import { SalesStockService } from './services/sales-stock.service';

import { SalesUpdateService } from './services/sales-update.service';
import { HeldSaleService } from './services/held-sale.service';
import { SaveHeldSaleDto } from './dto/save-held-sale.dto';

@Controller('sales')
export class SalesController {
 constructor(
  private readonly salesService: SalesService,
  private readonly salesStockService: SalesStockService,
  private readonly salesUpdateService: SalesUpdateService,
  private readonly heldSaleService: HeldSaleService,
) {}

  @Post()
  create(
    @Body() dto: CreateSalesDto,
  ) {
    return this.salesService.create(dto);
  }

  @Post('holds')
  hold(
    @Body() dto: SaveHeldSaleDto,
  ) {
    return this.heldSaleService.create(dto);
  }

  @Get('holds')
  findHeldSales() {
    return this.heldSaleService.findAll();
  }

  @Get('holds/:id')
  findHeldSale(
    @Param('id') id: string,
  ) {
    return this.heldSaleService.findOne(id);
  }

  @Put('holds/:id')
  updateHeldSale(
    @Param('id') id: string,
    @Body() dto: SaveHeldSaleDto,
  ) {
    return this.heldSaleService.update(id, dto);
  }

  @Delete('holds/:id')
  removeHeldSale(
    @Param('id') id: string,
  ) {
    return this.heldSaleService.remove(id);
  }

  @Put(':id')
update(
  @Param('id') id: string,
  @Body() dto: CreateSalesDto,
) {
  return this.salesUpdateService.updateSales(
    id,
    dto,
  );
}

  @Get()
  findAll() {
    return this.salesService.findAll();
  }

  // =====================================================
  // ALL STOCK FOR WAREHOUSE
  // =====================================================

  @Get('stock/:warehouseId')
  getWarehouseStock(
    @Param('warehouseId')
    warehouseId: string,
  ) {
    return this.salesStockService.getWarehouseStocks(
      warehouseId,
    );
  }

  // =====================================================
  // STOCK FOR ONE BATCH
  // =====================================================

  @Get(
    'stock/:warehouseId/:batchId',
  )
  getBatchStock(
    @Param('warehouseId')
    warehouseId: string,

    @Param('batchId')
    batchId: string,
  ) {
    return this.salesStockService.getBatchStocks(
      [batchId],
      warehouseId,
    );
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.salesService.findOne(id);
  }
}
