import { IsBoolean, IsInt, IsOptional, IsString, Min } from 'class-validator';

export class CreateDocumentSeriesDto {
  @IsString()
  documentType: string;

  @IsString()
  name: string;

  @IsString()
  prefix: string;

  @IsOptional()
  @IsString()
  suffix?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  padding = 6;

  @IsOptional()
  @IsInt()
  @Min(0)
  currentNumber = 0;

  @IsOptional()
  @IsBoolean()
  resetYearly = false;

  @IsOptional()
  @IsString()
  financialYear?: string;

  @IsOptional()
  @IsBoolean()
  isActive = true;
}