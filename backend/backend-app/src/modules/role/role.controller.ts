import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from "@nestjs/common";

import { RoleService } from "./role.service";
import { CreateRoleDto } from "./dto/create-role.dto";
import { UpdateRoleDto } from "./dto/update-role.dto";
import { UpdateRolePermissionsDto } from "./dto/update-role-permissions.dto";

import { JwtAuthGuard } from "../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../auth/guards/permissions.guard";
import { RequirePermissions } from "../auth/decorators/require-permissions.decorator";

@Controller("roles")
export class RoleController {
  constructor(
    private readonly roleService: RoleService,
  ) {}

  @Get()
  findAll() {
    return this.roleService.findAll();
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.roleService.findOne(id);
  }

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("MANAGE_USERS")
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Put(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("MANAGE_USERS")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateRoleDto,
  ) {
    return this.roleService.update(id, dto);
  }

  @Put(":id/permissions")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("MANAGE_USERS")
  updatePermissions(
    @Param("id") id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.roleService.updatePermissions(
      id,
      dto,
    );
  }

  @Delete(":id")
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions("MANAGE_USERS")
  remove(@Param("id") id: string) {
    return this.roleService.remove(id);
  }
}
