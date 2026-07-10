import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { SubCategoryService } from "./sub-category.service";
import { CreateSubCategoryDto } from "./dto/create-sub-category.dto";
import { UpdateSubCategoryDto } from "./dto/update-sub-category.dto";

@Controller("sub-categories")
export class SubCategoryController {
  constructor(
    private readonly subCategoryService: SubCategoryService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateSubCategoryDto,
  ) {
    return this.subCategoryService.create(dto);
  }

  @Get()
  findAll() {
    return this.subCategoryService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.subCategoryService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateSubCategoryDto,
  ) {
    return this.subCategoryService.update(id, dto);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
  ) {
    return this.subCategoryService.remove(id);
  }
}