import {
  IsDateString,
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreatePettyExpenseDto {
  @IsOptional()
  @IsDateString()
  expenseDate?: string;

  @IsString()
  @IsNotEmpty()
  category: string;

  @IsNumber()
  @Min(0.01)
  amount: number;

  @IsOptional()
  @IsIn(['CASH', 'UPI', 'CARD'])
  paymentMode?: string;

  @IsOptional()
  @IsString()
  remarks?: string;
}
