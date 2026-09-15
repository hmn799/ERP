import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSaleReturnPaymentDto {
  @IsIn([
    'CASH',
    'UPI',
    'CARD',
    'CREDIT',
  ])
  paymentMode!: string;

  @IsNumber()
  @Min(0.01)
  amount!: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  cardSurcharge?: number;

  @IsOptional()
  @IsString()
  transactionNo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}