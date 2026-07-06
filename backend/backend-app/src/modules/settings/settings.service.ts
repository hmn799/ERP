import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

import { CreateSettingDto } from './dto/create-setting.dto';
import { UpdateSettingDto } from './dto/update-setting.dto';

@Injectable()
export class SettingsService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async create(dto: CreateSettingDto) {
    const exists =
      await this.prisma.systemSetting.findUnique({
        where: {
          settingKey: dto.settingKey,
        },
      });

    if (exists) {
      throw new ConflictException(
        'Setting already exists.',
      );
    }

    return this.prisma.systemSetting.create({
      data: {
        groupName: dto.groupName,
        settingKey: dto.settingKey,
        value: dto.value,
        valueType: dto.valueType,
        description: dto.description,
        isEditable: dto.isEditable ?? true,
      },
    });
  }

  async findAll() {
    return this.prisma.systemSetting.findMany({
      orderBy: [
        { groupName: 'asc' },
        { settingKey: 'asc' },
      ],
    });
  }

  async findOne(settingKey: string) {
    const setting =
      await this.prisma.systemSetting.findUnique({
        where: {
          settingKey,
        },
      });

    if (!setting) {
      throw new NotFoundException(
        'Setting not found.',
      );
    }

    return setting;
  }

  async findByGroup(groupName: string) {
    return this.prisma.systemSetting.findMany({
      where: {
        groupName,
      },
      orderBy: {
        settingKey: 'asc',
      },
    });
  }

  async update(
    settingKey: string,
    dto: UpdateSettingDto,
  ) {
    await this.findOne(settingKey);

    return this.prisma.systemSetting.update({
      where: {
        settingKey,
      },
      data: dto,
    });
  }

  async remove(settingKey: string) {
    await this.findOne(settingKey);

    return this.prisma.systemSetting.delete({
      where: {
        settingKey,
      },
    });
  }

  // -----------------------------
  // Typed Helper Methods
  // -----------------------------

  async getString(settingKey: string): Promise<string> {
    const setting = await this.findOne(settingKey);
    return setting.value;
  }

  async getBoolean(settingKey: string): Promise<boolean> {
    const setting = await this.findOne(settingKey);
    return setting.value.toLowerCase() === 'true';
  }

  async getNumber(settingKey: string): Promise<number> {
    const setting = await this.findOne(settingKey);
    return Number(setting.value);
  }

  async getJson<T = any>(settingKey: string): Promise<T> {
    const setting = await this.findOne(settingKey);
    return JSON.parse(setting.value) as T;
  }
}