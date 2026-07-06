import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { CustomerService } from './customer.service';

import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(
    private readonly customerService: CustomerService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateCustomerDto,
  ) {
    return this.customerService.create(dto);
  }

  @Get()
  findAll() {
    return this.customerService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.customerService.findOne(id);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ) {
    return this.customerService.delete(id);
  }
}