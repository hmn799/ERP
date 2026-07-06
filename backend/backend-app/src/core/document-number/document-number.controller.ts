import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { DocumentNumberService } from './document-number.service';

import { CreateDocumentSeriesDto } from './dto/create-document-series.dto';
import { UpdateDocumentSeriesDto } from './dto/update-document-series.dto';

@Controller('document-series')
export class DocumentNumberController {
  constructor(
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateDocumentSeriesDto,
  ) {
    return this.documentNumberService.create(dto);
  }

  @Get()
  findAll() {
    return this.documentNumberService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.documentNumberService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateDocumentSeriesDto,
  ) {
    return this.documentNumberService.update(id, dto);
  }

  @Delete(':id')
  remove(
    @Param('id') id: string,
  ) {
    return this.documentNumberService.remove(id);
  }

  @Get('preview/:type')
  preview(
    @Param('type') type: string,
  ) {
    return this.documentNumberService.preview(type);
  }

  @Post('next/:type')
  next(
    @Param('type') type: string,
  ) {
    return this.documentNumberService.next(type);
  }
}