import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
} from '@nestjs/common';

import { SettingsService } from './settings.service';

import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Controller('settings')
export class SettingsController {
  constructor(
    private readonly settingsService: SettingsService,
  ) {}

  @Post()
  create(
    @Body()
    dto: CreateSettingDto,
  ) {
    return this.settingsService.create(dto);
  }

  @Get()
  findAll() {
    return this.settingsService.findAll();
  }

  @Get('group/:groupName')
  findByGroup(
    @Param('groupName')
    groupName: string,
  ) {
    return this.settingsService.findByGroup(
      groupName,
    );
  }

  @Get(':settingKey')
  findOne(
    @Param('settingKey')
    settingKey: string,
  ) {
    return this.settingsService.findOne(
      settingKey,
    );
  }

  @Patch(':settingKey')
  update(
    @Param('settingKey')
    settingKey: string,

    @Body()
    dto: UpdateSettingDto,
  ) {
    return this.settingsService.update(
      settingKey,
      dto,
    );
  }

  @Delete(':settingKey')
  remove(
    @Param('settingKey')
    settingKey: string,
  ) {
    return this.settingsService.remove(
      settingKey,
    );
  }
}