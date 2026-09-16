import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Put,
  UseGuards,
} from '@nestjs/common';

import { ShortcutService } from './shortcut.service';
import { UpdateShortcutDto } from './dto/update-shortcut.dto';
import { SetRoleShortcutDto } from './dto/set-role-shortcut.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';

@Controller('shortcuts')
export class ShortcutController {
  constructor(
    private readonly shortcutService: ShortcutService,
  ) {}

  @Get()
  findAll() {
    return this.shortcutService.findAll();
  }

  @Get('effective/:roleId')
  getEffectiveForRole(
    @Param('roleId') roleId: string,
  ) {
    return this.shortcutService.getEffectiveForRole(
      roleId,
    );
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.shortcutService.findOne(id);
  }

  @Put(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_SETTINGS')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateShortcutDto,
  ) {
    return this.shortcutService.update(id, dto);
  }

  @Put(':id/reset')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_SETTINGS')
  resetToDefault(@Param('id') id: string) {
    return this.shortcutService.resetToDefault(id);
  }

  @Put(':id/role/:roleId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_SETTINGS')
  setRoleOverride(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
    @Body() dto: SetRoleShortcutDto,
  ) {
    return this.shortcutService.setRoleOverride(
      id,
      roleId,
      dto,
    );
  }

  @Delete(':id/role/:roleId')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @RequirePermissions('MANAGE_SETTINGS')
  removeRoleOverride(
    @Param('id') id: string,
    @Param('roleId') roleId: string,
  ) {
    return this.shortcutService.removeRoleOverride(
      id,
      roleId,
    );
  }
}
