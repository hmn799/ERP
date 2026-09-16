import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class UpdateShortcutDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(40)
  currentKey?: string;

  @IsOptional()
  @IsBoolean()
  isEnabled?: boolean;
}
