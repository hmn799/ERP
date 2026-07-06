import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { SalesmanService } from './salesman.service';

import { CreateSalesmanDto } from './dto/create-salesman.dto';

@Controller('salesmen')
export class SalesmanController {
  constructor(
    private readonly salesmanService: SalesmanService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateSalesmanDto,
  ) {
    return this.salesmanService.create(dto);
  }

  @Get()
  findAll() {
    return this.salesmanService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.salesmanService.findOne(id);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ) {
    return this.salesmanService.delete(id);
  }
}