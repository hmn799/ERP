import { Decimal } from '@prisma/client/runtime/library';

import { PriceSourceType } from '../enums/price-source.enum';

export interface PricingResult {
  salePrice: Decimal;

  source: PriceSourceType;

  minimumPrice?: Decimal | null;

  maximumDiscountPercent?: Decimal | null;

  allowManualOverride: boolean;
}