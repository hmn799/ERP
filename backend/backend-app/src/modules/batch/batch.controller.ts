import { Controller, Get, Param, Delete } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

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
}