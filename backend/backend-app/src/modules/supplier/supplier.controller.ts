import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SupplierService } from './supplier.service';
import { CreateSupplierDto } from './dto/create-supplier.dto';

@Controller('suppliers')
export class SupplierController {
  constructor(
    private readonly supplierService: SupplierService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateSupplierDto,
  ) {
    return this.supplierService.create(dto);
  }

  @Get()
  findAll() {
    return this.supplierService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.supplierService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.supplierService.remove(id);
  }
}