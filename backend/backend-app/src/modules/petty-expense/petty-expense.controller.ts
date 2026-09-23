import {
  Body,
  Controller,
  Get,
  Post,
  Query,
} from '@nestjs/common';

import { PettyExpenseService } from './petty-expense.service';
import { CreatePettyExpenseDto } from './dto/create-petty-expense.dto';

@Controller('petty-expenses')
export class PettyExpenseController {
  constructor(
    private readonly pettyExpenseService: PettyExpenseService,
  ) {}

  @Post()
  create(@Body() dto: CreatePettyExpenseDto) {
    return this.pettyExpenseService.create(dto);
  }

  @Get('recent')
  recent(@Query('limit') limit?: string) {
    return this.pettyExpenseService.recent(
      limit ? Number(limit) : undefined,
    );
  }
}
