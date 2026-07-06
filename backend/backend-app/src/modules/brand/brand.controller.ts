import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { BrandService } from './brand.service';
import { CreateBrandDto } from './dto/create-brand.dto';

@Controller('brands')
export class BrandController {
  constructor(
    private readonly brandService: BrandService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateBrandDto,
  ) {
    return this.brandService.create(dto);
  }

  @Get()
  findAll() {
    return this.brandService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.brandService.findOne(id);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.brandService.remove(id);
  }
}