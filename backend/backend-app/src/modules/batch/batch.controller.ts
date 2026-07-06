import { Controller, Get, Param, Delete } from '@nestjs/common';
import { BatchService } from './batch.service';

@Controller('batches')
export class BatchController {
  constructor(private readonly batchService: BatchService) {}

  @Get()
  findAll() {
    return this.batchService.findAll();
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