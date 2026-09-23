import {
  IsDateString,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class GetSellingPriceDto {
  @IsString()
  @IsNotEmpty()
  itemId: string;

  @IsOptional()
  @IsString()
  customerId?: string;

  @IsNumber()
  @Min(0.01)
  quantity: number;

  @IsOptional()
  @IsDateString()
  billDate?: string;
}
