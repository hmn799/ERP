import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from '@nestjs/common';

import { SchemeService } from './scheme.service';
import { CreateSchemeDto } from './dto/create-scheme.dto';
import { UpdateSchemeDto } from './dto/update-scheme.dto';

@Controller('schemes')
export class SchemeController {
  constructor(
    private readonly schemeService: SchemeService,
  ) {}

  @Post()
  create(@Body() dto: CreateSchemeDto) {
    return this.schemeService.create(dto);
  }

  @Get()
  findAll() {
    return this.schemeService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.schemeService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateSchemeDto,
  ) {
    return this.schemeService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.schemeService.remove(id);
  }
}
