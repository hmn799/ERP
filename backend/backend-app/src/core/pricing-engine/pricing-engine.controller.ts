import { Controller, Get, Query } from '@nestjs/common';

import { PricingEngineService } from './pricing-engine.service';
import { GetSellingPriceDto } from './dto/get-selling-price.dto';

/*
 * Read-only preview of the qty-tiered override rate for an item -
 * used by the Sales bill to show the correct rate live as the
 * cashier edits qty, before the same resolution runs again
 * (authoritatively) at save time in SalesCalculationService.
 */
@Controller('pricing')
export class PricingEngineController {
  constructor(
    private readonly pricingEngineService: PricingEngineService,
  ) {}

  /*
   * Wrapped in { price } rather than returned bare - a bare `null`
   * (the common case: no qty tier applies) serializes to an EMPTY
   * response body, not the JSON literal "null", which breaks a
   * naive `response.json()` on the caller's side.
   */
  @Get('selling-price')
  async getSellingPrice(
    @Query() dto: GetSellingPriceDto,
  ) {
    const price =
      await this.pricingEngineService.getSellingPrice(
        dto,
      );

    return { price };
  }
}
