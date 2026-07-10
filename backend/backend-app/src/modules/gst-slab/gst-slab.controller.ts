import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
} from "@nestjs/common";

import { GstSlabService } from "./gst-slab.service";
import { CreateGstSlabDto } from "./dto/create-gst-slab.dto";
import { UpdateGstSlabDto } from "./dto/update-gst-slab.dto";

@Controller("gst-slabs")
export class GstSlabController {
  constructor(
    private readonly gstSlabService: GstSlabService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateGstSlabDto,
  ) {
    return this.gstSlabService.create(dto);
  }

  @Get()
  findAll() {
    return this.gstSlabService.findAll();
  }

  @Get(":id")
  findOne(
    @Param("id") id: string,
  ) {
    return this.gstSlabService.findOne(id);
  }

  @Put(":id")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateGstSlabDto,
  ) {
    return this.gstSlabService.update(id, dto);
  }

  @Delete(":id")
  remove(
    @Param("id") id: string,
  ) {
    return this.gstSlabService.remove(id);
  }
}