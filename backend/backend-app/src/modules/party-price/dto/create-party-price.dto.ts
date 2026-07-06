export class CreatePartyPriceDto {
  customerId: string;

  itemId: string;

  salePrice: number;

  minimumPrice?: number;

  maximumDiscountPercent?: number;

  effectiveFrom?: Date;

  effectiveTo?: Date;

  allowManualOverride?: boolean;

  isActive?: boolean;

  changedBy?: string;

  remarks?: string;
}