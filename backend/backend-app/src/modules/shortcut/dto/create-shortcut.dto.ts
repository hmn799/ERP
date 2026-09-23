import {
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';

export class CreateShortcutDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  label: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  category?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(40)
  key: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  targetPath: string;
}
