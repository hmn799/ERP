import {
  Body,
  Controller,
  Get,
  Put,
} from "@nestjs/common";

import { CompanyService } from "./company.service";
import { UpdateCompanyDto } from "./dto/update-company.dto";

@Controller("company")
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
  ) {}

  @Get()
  getProfile() {
    return this.companyService.getProfile();
  }

  @Put()
  updateProfile(
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companyService.updateProfile(dto);
  }
}
