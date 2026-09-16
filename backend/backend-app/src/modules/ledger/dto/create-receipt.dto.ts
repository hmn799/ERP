import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateReceiptDto {
  @IsString()
  @IsNotEmpty()
  customerId: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsDateString()
  receiptDate: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
