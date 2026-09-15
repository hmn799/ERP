import {
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';

export class CreateSalesItemDto {
  @IsString()
  itemId!: string;

  @IsString()
  batchId!: string;

  @IsNumber()
  @Min(0.01)
  qty!: number;

  @IsNumber()
  @Min(0)
  discountPercent!: number;

  @IsNumber()
  @Min(0)
  gstPercent!: number;

  /**
   * Effective sale rate used on the bill.
   *
   * This may be:
   * - the normal batch/customer price-level rate, OR
   * - a manually overridden rate entered by the user.
   */
  @IsOptional()
  @IsNumber()
  @Min(0)
  saleRate?: number;
}