import { IsBoolean, IsEnum, IsOptional, IsString } from 'class-validator';

export enum SettingValueType {
  STRING = 'STRING',
  NUMBER = 'NUMBER',
  BOOLEAN = 'BOOLEAN',
  JSON = 'JSON',
}

export class CreateSettingDto {
  @IsString()
  groupName: string;

  @IsString()
  settingKey: string;

  @IsString()
  value: string;

  @IsEnum(SettingValueType)
  valueType: SettingValueType;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsBoolean()
  isEditable?: boolean = true;
}