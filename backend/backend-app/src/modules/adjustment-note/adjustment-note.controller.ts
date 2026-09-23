import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
} from '@nestjs/common';

import { AdjustmentNoteService } from './adjustment-note.service';
import { CreateAdjustmentNoteDto } from './dto/create-adjustment-note.dto';

@Controller('adjustment-notes')
export class AdjustmentNoteController {
  constructor(
    private readonly adjustmentNoteService: AdjustmentNoteService,
  ) {}

  @Post()
  create(@Body() dto: CreateAdjustmentNoteDto) {
    return this.adjustmentNoteService.create(dto);
  }

  @Get()
  findAll(
    @Query('noteType') noteType?: 'DEBIT' | 'CREDIT',
  ) {
    return this.adjustmentNoteService.findAll(noteType);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.adjustmentNoteService.findOne(id);
  }

  @Post(':id/cancel')
  cancel(@Param('id') id: string) {
    return this.adjustmentNoteService.cancel(id);
  }
}
