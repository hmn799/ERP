import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

import { BatchService } from './batch.service';
import { BatchBarcodeService } from './services/batch-barcode.service';

import { AddBatchBarcodeDto } from './dto/add-batch-barcode.dto';

@Controller('batches')
export class BatchController {
  constructor(
    private readonly batchService: BatchService,
    private readonly batchBarcodeService: BatchBarcodeService,
  ) {}

  @Get()
  findAll() {
    return this.batchService.findAll();
  }

  /*
   * Active batches for one item, oldest expiry first - lets purchase
   * entry show the operator which batches already exist for an item
   * so they can reuse one instead of always creating a new batch.
   */
  @Get('by-item/:itemId')
  findByItem(@Param('itemId') itemId: string) {
    return this.batchService.findByItem(itemId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.batchService.findOne(id);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.batchService.remove(id);
  }

  @Post(':id/barcodes')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_BATCH_BARCODES')
  addBarcode(
    @Param('id') id: string,
    @Body() dto: AddBatchBarcodeDto,
  ) {
    return this.batchBarcodeService.addBarcode(id, dto.barcode);
  }

  @Delete(':id/barcodes/:barcodeId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_BATCH_BARCODES')
  removeBarcode(
    @Param('id') id: string,
    @Param('barcodeId') barcodeId: string,
  ) {
    return this.batchBarcodeService.removeBarcode(id, barcodeId);
  }

  @Patch(':id/barcodes/:barcodeId/primary')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_BATCH_BARCODES')
  setPrimaryBarcode(
    @Param('id') id: string,
    @Param('barcodeId') barcodeId: string,
  ) {
    return this.batchBarcodeService.setPrimaryBarcode(id, barcodeId);
  }
}
