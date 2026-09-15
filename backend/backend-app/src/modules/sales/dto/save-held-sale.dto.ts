import {
  IsOptional,
  IsString,
  MaxLength,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

import { CreateSalesDto } from './create-sales.dto';

export class SaveHeldSaleDto extends CreateSalesDto {
  @IsOptional()
  @IsString()
  @MaxLength(100)
  holdName?: string;
}
