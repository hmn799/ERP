import {
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSalesPaymentDto {
  @IsIn([
    'CASH',
    'UPI',
    'CARD',
    'CREDIT',
  ])
  paymentMode!: string;

  @IsNumber()
  @Min(0)
  amount!: number;

  @IsOptional()
  @IsIn(['AMOUNT', 'PERCENT'])
  surchargeType?: string;

  @IsOptional()
  @IsNumber()
  @Min(0)
  surchargeValue?: number;

  @IsOptional()
  @IsString()
  transactionNo?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}