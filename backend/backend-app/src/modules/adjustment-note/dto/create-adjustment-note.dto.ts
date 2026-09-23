import {
  ArrayMinSize,
  IsArray,
  IsIn,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  ValidateNested,
} from 'class-validator';

import { Type } from 'class-transformer';

export class AdjustmentNoteItemDto {
  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  hsnCode?: string;

  @IsNumber()
  @Min(0.01)
  taxableAmount: number;

  @IsNumber()
  @Min(0)
  @Max(100)
  gstPercent: number;
}

export class CreateAdjustmentNoteDto {
  @IsIn(['DEBIT', 'CREDIT'])
  noteType: 'DEBIT' | 'CREDIT';

  @IsDateString()
  noteDate: string;

  // supplierId when noteType is DEBIT, customerId when CREDIT.
  @IsString()
  @IsNotEmpty()
  partyId: string;

  @IsString()
  @IsNotEmpty()
  reason: string;

  @IsOptional()
  @IsString()
  referenceType?: string;

  @IsOptional()
  @IsString()
  referenceId?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => AdjustmentNoteItemDto)
  items: AdjustmentNoteItemDto[];
}
