import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  ValidateNested,
} from 'class-validator';

class ImportBankTransactionRowDto {
  @IsDateString()
  transactionDate: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsOptional()
  @IsString()
  referenceNo?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  debitAmount?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  creditAmount?: number;
}

export class ImportBankTransactionsDto {
  @IsString()
  @IsNotEmpty()
  bankAccountId: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => ImportBankTransactionRowDto)
  rows: ImportBankTransactionRowDto[];
}
