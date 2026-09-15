import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';

export interface SchemeExpandedItem {
  itemId: string;
  batchId: string;
  qty: number;
  discountPercent: number;
  gstPercent?: number;
  saleRate?: number;
  freeQty: number;
  schemeId?: string;
}

/**
 * Scheme Engine.
 *
 * Given the items a cashier entered, works out what purchase-defined
 * schemes apply and returns an expanded item list:
 *
 * - QUANTITY (10+1): the trigger item's own line grows by the free
 *   quantity earned (qty submitted is the PAID quantity; the engine
 *   adds the free portion on top).
 * - FREE_ITEM: a new line is appended for the free item, fully free.
 * - DISCOUNT: an extra discount percentage is added to the trigger
 *   item's line, stacked on top of any manual discount.
 *
 * Every expanded line carries `freeQty` (the portion of `qty` that is
 * free) so the caller can bill on (qty - freeQty) while still shipping
 * and deducting stock for the full qty.
 */
@Injectable()
export class SchemeEngineService {
  async applySchemes(
    items: Array<{
      itemId: string;
      batchId: string;
      qty: number;
      discountPercent: number;
      gstPercent?: number;
      saleRate?: number;
    }>,
    warehouseId: string,
    tx: Prisma.TransactionClient,
  ): Promise<SchemeExpandedItem[]> {
    const itemIds = [
      ...new Set(
        items.map((item) => item.itemId),
      ),
    ];

    if (itemIds.length === 0) {
      return [];
    }

    const now = new Date();

    const schemes = await tx.scheme.findMany({
      where: {
        itemId: { in: itemIds },
        isActive: true,
        AND: [
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
        ],
      },
    });

    const expanded: SchemeExpandedItem[] = [];

    for (const item of items) {
      const matching = schemes.filter(
        (scheme) => scheme.itemId === item.itemId,
      );

      let freeQtyForLine = 0;
      let extraDiscount = 0;
      let schemeIdForLine: string | undefined;

      for (const scheme of matching) {
        if (
          scheme.schemeType === 'QUANTITY' &&
          scheme.buyQty &&
          scheme.freeQty
        ) {
          const multiples = Math.floor(
            item.qty / Number(scheme.buyQty),
          );

          if (multiples > 0) {
            freeQtyForLine +=
              multiples * Number(scheme.freeQty);

            schemeIdForLine = scheme.id;
          }
        }

        if (
          scheme.schemeType === 'DISCOUNT' &&
          scheme.discountPercent
        ) {
          extraDiscount += Number(
            scheme.discountPercent,
          );

          schemeIdForLine =
            schemeIdForLine ?? scheme.id;
        }
      }

      expanded.push({
        ...item,
        qty: item.qty + freeQtyForLine,
        freeQty: freeQtyForLine,
        discountPercent: Math.min(
          100,
          Number(item.discountPercent || 0) +
            extraDiscount,
        ),
        schemeId: schemeIdForLine,
      });

      for (const scheme of matching) {
        if (
          scheme.schemeType !== 'FREE_ITEM' ||
          !scheme.freeItemId ||
          !scheme.buyQty ||
          !scheme.freeQty
        ) {
          continue;
        }

        const multiples = Math.floor(
          item.qty / Number(scheme.buyQty),
        );

        if (multiples <= 0) {
          continue;
        }

        const grantedQty =
          multiples * Number(scheme.freeQty);

        const batch =
          await this.resolveFreeItemBatch(
            scheme.freeItemId,
            warehouseId,
            grantedQty,
            tx,
          );

        if (!batch) {
          continue;
        }

        expanded.push({
          itemId: scheme.freeItemId,
          batchId: batch.id,
          qty: grantedQty,
          freeQty: grantedQty,
          discountPercent: 0,
          schemeId: scheme.id,
        });
      }
    }

    return expanded;
  }

  private async resolveFreeItemBatch(
    itemId: string,
    warehouseId: string,
    requiredQty: number,
    tx: Prisma.TransactionClient,
  ) {
    const stocks = await tx.warehouseStock.findMany({
      where: {
        itemId,
        warehouseId,
        quantity: { gt: 0 },
      },
      orderBy: { quantity: 'desc' },
    });

    const best = stocks.find(
      (stock) =>
        Number(stock.quantity) >= requiredQty,
    );

    const batchId = (best ?? stocks[0])?.batchId;

    if (!batchId) {
      return null;
    }

    return tx.batch.findUnique({
      where: { id: batchId },
    });
  }
}
