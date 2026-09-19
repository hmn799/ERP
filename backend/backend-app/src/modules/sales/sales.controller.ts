import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Post,
  Put,
  Res,
  UseGuards,
} from '@nestjs/common';

import type { Response } from 'express';

import { SalesService } from './sales.service';

import { CreateSalesDto } from './dto/create-sales.dto';

import { SalesStockService } from './services/sales-stock.service';

import { SalesUpdateService } from './services/sales-update.service';
import { HeldSaleService } from './services/held-sale.service';
import { SaveHeldSaleDto } from './dto/save-held-sale.dto';

import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

import { PdfService } from '../../core/pdf/pdf.service';
import { CompanyService } from '../company/company.service';

@Controller('sales')
export class SalesController {
 constructor(
  private readonly salesService: SalesService,
  private readonly salesStockService: SalesStockService,
  private readonly salesUpdateService: SalesUpdateService,
  private readonly heldSaleService: HeldSaleService,
  private readonly pdfService: PdfService,
  private readonly companyService: CompanyService,
) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(
    @Body() dto: CreateSalesDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.salesService.create(
      dto,
      user?.permissions,
      user
        ? { id: user.sub, name: user.fullName || user.username }
        : undefined,
    );
  }

  @Post('preview')
  @UseGuards(OptionalJwtAuthGuard)
  preview(
    @Body() dto: CreateSalesDto,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.salesService.preview(
      dto,
      user?.permissions,
    );
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
  @UseGuards(OptionalJwtAuthGuard)
update(
  @Param('id') id: string,
  @Body() dto: CreateSalesDto,
  @CurrentUser() user?: AuthUser,
) {
  return this.salesUpdateService.updateSales(
    id,
    dto,
    user?.permissions,
    user
      ? { id: user.sub, name: user.fullName || user.username }
      : undefined,
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

  @Get(':id/invoice-pdf')
  async invoicePdf(
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const bill = await this.salesService.findOne(id);

    if (!bill) {
      throw new NotFoundException('Sales bill not found.');
    }

    const company = await this.companyService.getProfile();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `inline; filename="${bill.billNo}.pdf"`,
    );

    const doc = this.pdfService.generateInvoicePdf(
      bill as any,
      company,
    );

    doc.pipe(res);
  }
}
