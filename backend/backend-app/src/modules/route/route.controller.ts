import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
} from '@nestjs/common';

import { RouteService } from './route.service';

import { CreateRouteDto } from './dto/create-route.dto';

@Controller('routes')
export class RouteController {
  constructor(
    private readonly routeService: RouteService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateRouteDto,
  ) {
    return this.routeService.create(dto);
  }

  @Get()
  findAll() {
    return this.routeService.findAll();
  }

  @Get(':id')
  findOne(
    @Param('id') id: string,
  ) {
    return this.routeService.findOne(id);
  }

  @Delete(':id')
  delete(
    @Param('id') id: string,
  ) {
    return this.routeService.delete(id);
  }
}