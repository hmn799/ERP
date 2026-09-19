import {
  Body,
  Controller,
  Get,
  Param,
  Post,
} from "@nestjs/common";

import { FinancialYearService } from "./financial-year.service";
import { CreateFinancialYearDto } from "./dto/create-financial-year.dto";

@Controller("financial-years")
export class FinancialYearController {
  constructor(
    private readonly financialYearService: FinancialYearService,
  ) {}

  @Post()
  create(@Body() dto: CreateFinancialYearDto) {
    return this.financialYearService.create(dto);
  }

  @Get()
  findAll() {
    return this.financialYearService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.financialYearService.findOne(id);
  }

  @Post(":id/close")
  close(@Param("id") id: string) {
    return this.financialYearService.close(id);
  }

  @Post(":id/reopen")
  reopen(@Param("id") id: string) {
    return this.financialYearService.reopen(id);
  }
}
