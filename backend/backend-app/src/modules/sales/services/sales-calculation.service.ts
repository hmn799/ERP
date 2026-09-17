import {
  ForbiddenException,
  Injectable,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { CreateSalesDto } from '../dto/create-sales.dto';

import { PrismaService } from '../../prisma/prisma.service';

import { SalesStockService } from './sales-stock.service';
import { SalesGstService } from './sales-gst.service';
import { SchemeEngineService } from '../../scheme/scheme-engine.service';

@Injectable()
export class SalesCalculationService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: SalesStockService,
    private readonly gstService: SalesGstService,
    private readonly schemeEngine: SchemeEngineService,
  ) {}

  async calculate(
    dto: CreateSalesDto,
    tx: Prisma.TransactionClient,
    permissions: string[] = [],
  ) {
    // =====================================================
    // DISCOUNT PERMISSION
    //
    // Checked against what the cashier actually submitted,
    // before scheme expansion - a scheme's own automatic
    // discount is not a manual action and never needs this.
    // =====================================================

    const manualDiscountRequested =
      Number(dto.billDiscountPercent || 0) > 0 ||
      dto.items.some(
        (item) =>
          Number(item.discountPercent || 0) > 0,
      );

    if (
      manualDiscountRequested &&
      !permissions.includes('APPLY_DISCOUNT')
    ) {
      throw new ForbiddenException(
        'Applying a discount requires the APPLY_DISCOUNT permission.',
      );
    }

    // =====================================================
    // CUSTOMER
    // =====================================================

    const customer = dto.customerId
      ? await tx.customer.findUnique({
          where: {
            id: dto.customerId,
          },
        })
      : null;

    if (
      dto.customerId &&
      !customer
    ) {
      throw new Error(
        'Customer not found',
      );
    }

    // =====================================================
    // WAREHOUSE
    // =====================================================

    const warehouse =
      await tx.warehouse.findUnique({
        where: {
          id: dto.warehouseId,
        },
      });

    if (!warehouse) {
      throw new Error(
        'Warehouse not found',
      );
    }

    // =====================================================
    // ITEM CALCULATIONS
    // =====================================================

    const itemCalculations: any[] = [];

    let grossAmount = 0;
    let totalItemDiscount = 0;

    // =====================================================
    // TAX MODE
    //
    // EXCLUSIVE (default) | INCLUSIVE - how the entered
    // saleRate on this bill was interpreted. Every stored
    // saleRate is always tax-exclusive regardless of this
    // flag - converted once, here, at save time - applied
    // uniformly to whatever rate ends up billed (batch
    // default, party price, or a manual override) so the
    // whole bill reads consistently in whichever mode the
    // cashier chose.
    // =====================================================

    const taxMode =
      dto.taxMode ?? 'EXCLUSIVE';

    const toExclusiveRate = (
      rate: number,
      gstPercent: number,
    ) => {
      if (taxMode !== 'INCLUSIVE') {
        return rate;
      }

      const gst =
        Number(gstPercent) || 0;

      if (gst <= 0) {
        return rate;
      }

      return Number(
        (rate / (1 + gst / 100)).toFixed(4),
      );
    };

    // =====================================================
    // SCHEME EXPANSION
    //
    // Adds free quantity to QUANTITY-scheme lines, injects
    // new lines for FREE_ITEM schemes, and stacks DISCOUNT
    // schemes onto the submitted discount. See scheme-engine
    // for the full rules.
    // =====================================================

    const expandedItems =
      await this.schemeEngine.applySchemes(
        dto.items,
        dto.warehouseId,
        tx,
      );

    for (
      const item of expandedItems
    ) {
      if (
        item.qty <= 0
      ) {
        throw new Error(
          `Invalid quantity for item ${item.itemId}`,
        );
      }

      const batch =
        await tx.batch.findUnique({
          where: {
            id: item.batchId,
          },

          include: {
            item: {
              include: {
                gstSlab: true,
              },
            },
          },
        });

      if (!batch) {
        throw new Error(
          `Batch not found: ${item.batchId}`,
        );
      }

      if (
        batch.itemId !==
        item.itemId
      ) {
        throw new Error(
          `Batch does not belong to item ${item.itemId}`,
        );
      }

      // ===================================================
      // GST
      //
      // Resolved before the sale rate below, since an
      // Inclusive-mode conversion needs the item's GST
      // percent to divide the entered rate down.
      // ===================================================

      const gstPercent =
        item.gstPercent !==
          undefined &&
        item.gstPercent !==
          null
          ? Number(
              item.gstPercent,
            )
          : Number(
              batch.item
                .gstSlab
                ?.percentage ??
                0,
            );

      // ===================================================
      // PARTY-DEFAULT BATCH RATE
      // ===================================================

      let batchRate = 0;

      switch (
        customer?.priceLevel?.toUpperCase()
      ) {
        case 'B':
        case 'RATE_B':
        case 'WHOLESALE':
          batchRate =
            Number(
              batch.wholesaleRate,
            );
          break;

        case 'C':
        case 'RATE_C':
        case 'DISTRIBUTOR':
          batchRate =
            Number(
              batch.distributorRate,
            );
          break;

        case 'A':
        case 'RATE_A':
        case 'RETAIL':
        default:
          batchRate =
            Number(
              batch.retailRate,
            );
      }

      // ===================================================
      // EFFECTIVE SALE RATE
      //
      // Priority:
      // 1. Active party-item rate.
      // 2. A rate deliberately changed from the party default.
      // 3. Customer default rate (A/B/C, represented by
      //    Retail/Wholesale/Distributor in existing data).
      // 4. MRP fallback.
      //
      // The UI has historically sent a saleRate for every
      // row, including untouched defaults. A value is only a
      // manual override when it differs from the calculated
      // party-default rate; this keeps existing clients safe.
      // ===================================================

      const suppliedSaleRate =
        item.saleRate !==
          undefined &&
        item.saleRate !==
          null;

      const partyPrice =
        customer
          ? await tx.partyPrice.findFirst({
              where: {
                customerId: customer.id,
                itemId: item.itemId,
                isActive: true,
                AND: [
                  {
                    OR: [
                      { effectiveFrom: null },
                      {
                        effectiveFrom: {
                          lte: new Date(),
                        },
                      },
                    ],
                  },
                  {
                    OR: [
                      { effectiveTo: null },
                      {
                        effectiveTo: {
                          gte: new Date(),
                        },
                      },
                    ],
                  },
                ],
              },
              orderBy: {
                updatedAt: 'desc',
              },
            })
          : null;

      const suppliedRate =
        suppliedSaleRate
          ? Number(item.saleRate)
          : undefined;

      const hasManualOverride =
        suppliedRate !== undefined &&
        Math.abs(suppliedRate - batchRate) >
          0.000001;

      if (
        hasManualOverride &&
        !permissions.includes('CHANGE_RATE')
      ) {
        throw new ForbiddenException(
          'Overriding the sale rate requires the CHANGE_RATE permission.',
        );
      }

      const fallbackRate =
        batchRate > 0
          ? batchRate
          : Number(batch.mrp);

      const resolvedRate =
        partyPrice
          ? Number(partyPrice.salePrice)
          : hasManualOverride
            ? suppliedRate
            : fallbackRate;

      const saleRate =
        toExclusiveRate(
          resolvedRate,
          gstPercent,
        );

      if (
        !Number.isFinite(
          saleRate,
        ) ||
        saleRate < 0
      ) {
        throw new Error(
          `Invalid sale rate for item ${item.itemId}.`,
        );
      }

      /*
       * A zero rate is only acceptable when
       * the cashier explicitly supplied zero, or
       * the line is entirely a scheme giveaway -
       * a free item has no billable rate to enforce.
       */
      const isFullyFreeLine =
        (item.freeQty || 0) >= item.qty &&
        item.qty > 0;

      if (
        saleRate === 0 &&
        !hasManualOverride &&
        !isFullyFreeLine
      ) {
        throw new Error(
          `No sale rate configured for batch ${batch.batchNo}. Enter a sale rate before saving the sale.`,
        );
      }

      // ===================================================
      // CURRENT STOCK
      // ===================================================

      const currentStock =
        await this.stockService.getCurrentStock(
          item.itemId,
          item.batchId,
          dto.warehouseId,
          tx,
        );

      if (
        currentStock < item.qty
      ) {
        console.warn(
          `Negative stock warning: Available=${currentStock}, Requested=${item.qty}`,
        );
      }

      // ===================================================
      // ITEM CALCULATION
      //
      // Billable qty excludes the scheme free portion -
      // a fully free line (freeQty === qty) taxes to zero
      // while still shipping and deducting full stock.
      // ===================================================

      const billableQty =
        item.qty -
        (item.freeQty || 0);

      const calc =
        this.gstService.calculateItem(
          billableQty,
          saleRate,
          item.discountPercent ||
            0,
          gstPercent,
        );

      grossAmount +=
        calc.grossAmount;

      totalItemDiscount +=
        calc.discountAmount;

      itemCalculations.push({
        item,
        batch,
        saleRate,
        gstPercent,
        calc,
        freeQty: item.freeQty || 0,
        schemeId: item.schemeId,
        hasManualOverride,
      });
    }

    // =====================================================
    // BILL DISCOUNT
    // =====================================================

    const billDiscountPercent =
      Number(
        dto.billDiscountPercent ||
          0,
      );

    if (
      billDiscountPercent < 0 ||
      billDiscountPercent > 100
    ) {
      throw new Error(
        'Bill discount must be between 0 and 100',
      );
    }

    const itemTaxableBeforeBillDiscount =
      itemCalculations.reduce(
        (
          total,
          row,
        ) =>
          total +
          Number(
            row.calc
              .taxableAmount,
          ),
        0,
      );

    const billDiscountAmount =
      itemTaxableBeforeBillDiscount *
      billDiscountPercent /
      100;

    let totalTaxable = 0;
    let totalCgst = 0;
    let totalSgst = 0;
    let totalIgst = 0;

    // =====================================================
    // FINAL TAX CALCULATION
    // =====================================================

    for (
      const row of itemCalculations
    ) {
      const originalTaxable =
        Number(
          row.calc
            .taxableAmount,
        );

      let itemBillDiscount =
        0;

      if (
        itemTaxableBeforeBillDiscount >
        0
      ) {
        itemBillDiscount =
          billDiscountAmount *
          originalTaxable /
          itemTaxableBeforeBillDiscount;
      }

      const finalTaxable =
        originalTaxable -
        itemBillDiscount;

      const gstAmount =
        finalTaxable *
        row.gstPercent /
        100;

      const cgstAmount =
        gstAmount / 2;

      const sgstAmount =
        gstAmount / 2;

      const igstAmount = 0;

      const netAmount =
        finalTaxable +
        gstAmount;

      row.itemBillDiscount =
        itemBillDiscount;

      row.finalTaxable =
        finalTaxable;

      row.finalCgst =
        cgstAmount;

      row.finalSgst =
        sgstAmount;

      row.finalIgst =
        igstAmount;

      row.finalNetAmount =
        netAmount;

      totalTaxable +=
        finalTaxable;

      totalCgst +=
        cgstAmount;

      totalSgst +=
        sgstAmount;

      totalIgst +=
        igstAmount;
    }

    // =====================================================
    // NET AMOUNT
    // =====================================================

    const netAmount = Number(
      (
        totalTaxable +
        totalCgst +
        totalSgst +
        totalIgst
      ).toFixed(2),
    );

    // =====================================================
    // ROUND OFF + SHORT AMOUNT
    // =====================================================

    const roundOff =
      Number(
        Number(
          dto.roundOff ?? 0,
        ).toFixed(2),
      );

    const shortAmount =
      Number(
        Number(
          dto.shortAmount ?? 0,
        ).toFixed(2),
      );

    if (
      !Number.isFinite(
        roundOff,
      ) ||
      !Number.isFinite(
        shortAmount,
      )
    ) {
      throw new Error(
        'Invalid R.OFF / Short amount.',
      );
    }

    if (
      shortAmount < 0
    ) {
      throw new Error(
        'Short amount cannot be negative.',
      );
    }

    const finalPayable =
      Number(
        (
          netAmount +
          roundOff -
          shortAmount
        ).toFixed(2),
      );

    if (
      finalPayable < 0
    ) {
      throw new Error(
        'Final payable amount cannot be negative.',
      );
    }

    return {
      customer,
      warehouse,

      itemCalculations,

      manualDiscountRequested,

      grossAmount,
      totalItemDiscount,

      billDiscountPercent,
      billDiscountAmount,

      totalTaxable,
      totalCgst,
      totalSgst,
      totalIgst,

      netAmount,

      roundOff,
      shortAmount,
      finalPayable,
    };
  }
}
