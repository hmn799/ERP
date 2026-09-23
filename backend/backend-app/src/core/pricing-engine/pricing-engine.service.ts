import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../../modules/prisma/prisma.service';

import { GetSellingPriceDto } from './dto/get-selling-price.dto';

import { PricingResult } from './interfaces/pricing-result.interface';

import { PriceSourceType } from './enums/price-source.enum';

/*
 * Among a set of qty-tiered rate rows, picks the one whose minQty
 * is the highest that still doesn't exceed the qty being priced -
 * "10 or more" beats "1 or more" once qty reaches 10, never below
 * it. Ties (the same minQty defined twice) fall back to whichever
 * was edited most recently.
 */
function pickBestTier<
  T extends { minQty: unknown; updatedAt: Date },
>(rows: T[], qty: number): T | null {
  const eligible = rows.filter(
    (row) => Number(row.minQty) <= qty,
  );

  if (eligible.length === 0) {
    return null;
  }

  return eligible.reduce((best, row) => {
    const rowMinQty = Number(row.minQty);
    const bestMinQty = Number(best.minQty);

    if (rowMinQty > bestMinQty) {
      return row;
    }

    if (
      rowMinQty === bestMinQty &&
      row.updatedAt > best.updatedAt
    ) {
      return row;
    }

    return best;
  });
}

@Injectable()
export class PricingEngineService {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  /*
   * Resolves the qty-tiered override rate for an item, or null when
   * neither the customer nor their price list defines one - the
   * normal case for most items, which the caller then prices off
   * the item/batch's own default rate instead. Never throws for
   * "no price configured"; that's expected, not exceptional.
   */
  async getSellingPrice(
    dto: GetSellingPriceDto,
    prisma: Prisma.TransactionClient | PrismaService = this
      .prisma,
  ): Promise<PricingResult | null> {
    const now = dto.billDate
      ? new Date(dto.billDate)
      : new Date();

    const dateWindow = [
      {
        OR: [
          { effectiveFrom: null },
          { effectiveFrom: { lte: now } },
        ],
      },
      {
        OR: [
          { effectiveTo: null },
          { effectiveTo: { gte: now } },
        ],
      },
    ];

    //
    // STEP 1
    // PARTY PRICE (customer + item, qty-tiered)
    //

    if (dto.customerId) {
      const partyPriceTiers =
        await prisma.partyPrice.findMany({
          where: {
            customerId: dto.customerId,
            itemId: dto.itemId,
            isActive: true,
            AND: dateWindow,
          },
        });

      const best = pickBestTier(
        partyPriceTiers,
        dto.quantity,
      );

      if (best) {
        return {
          salePrice: best.salePrice,
          minimumPrice: best.minimumPrice,
          maximumDiscountPercent:
            best.maximumDiscountPercent,
          allowManualOverride:
            best.allowManualOverride,
          source: PriceSourceType.PARTY_PRICE,
        };
      }
    }

    //
    // STEP 2
    // ITEM PRICE (the customer's assigned price list, or the
    // system default list when there's no customer or the
    // customer has none assigned - qty-tiered)
    //

    let priceListId: string | undefined;

    if (dto.customerId) {
      const customer =
        await prisma.customer.findUnique({
          where: { id: dto.customerId },
          select: { priceListId: true },
        });

      priceListId = customer?.priceListId ?? undefined;
    }

    if (!priceListId) {
      const defaultList =
        await prisma.priceList.findFirst({
          where: { isDefault: true, isActive: true },
          select: { id: true },
        });

      priceListId = defaultList?.id;
    }

    if (priceListId) {
      const itemPriceTiers =
        await prisma.itemPrice.findMany({
          where: {
            itemId: dto.itemId,
            priceListId,
            isActive: true,
            AND: dateWindow,
          },
        });

      const best = pickBestTier(
        itemPriceTiers,
        dto.quantity,
      );

      if (best) {
        return {
          salePrice: best.salePrice,
          minimumPrice: best.minimumPrice,
          maximumDiscountPercent:
            best.maximumDiscountPercent,
          allowManualOverride:
            best.allowManualOverride,
          source: PriceSourceType.ITEM_PRICE,
        };
      }
    }

    //
    // NO OVERRIDE RATE FOUND
    //

    return null;
  }
}
