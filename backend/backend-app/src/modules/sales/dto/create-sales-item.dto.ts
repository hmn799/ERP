import {
  IsBoolean,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateSalesItemDto {
  @IsString()
  itemId!: string;

  @IsString()
  batchId!: string;

  /**
   * Free-text description for a general (non-catalog) item line -
   * what actually sold, since the Item master is just a shared
   * placeholder. Ignored for an ordinary catalog item.
   */
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;

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

  /**
   * A return taken back within this same bill - an exchange, not a
   * separate SaleReturn document. Stock is restored instead of
   * consumed, and the line's amount subtracts from the bill totals
   * instead of adding to them.
   */
  @IsOptional()
  @IsBoolean()
  isReturn?: boolean;
}