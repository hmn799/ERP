import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

const DAY_MS = 24 * 60 * 60 * 1000;

// Reordering assumptions - no per-item lead time is tracked in the
// schema, so a single configurable default stands in for all items.
const DEFAULT_LEAD_TIME_DAYS = Number(
  process.env.REORDER_LEAD_TIME_DAYS || 7,
);
const DEFAULT_COVER_DAYS = Number(
  process.env.REORDER_COVER_DAYS || 30,
);

const VELOCITY_WINDOW_DAYS = 90;
const FAST_MOVER_COVER_THRESHOLD_DAYS = 15;

export interface ItemVelocity {
  itemId: string;
  itemCode: string;
  itemName: string;
  categoryId: string;
  categoryName: string;
  currentStock: number;
  qtySoldLast90Days: number;
  avgDailySales: number;
  daysOfCover: number | null;
  lastSoldDate: string | null;
  classification: 'FAST' | 'SLOW' | 'DEAD';
}

@Injectable()
export class AnalyticsService {
  constructor(private readonly prisma: PrismaService) {}

  /*
   * Shared building block for stock velocity, reorder
   * recommendations, and the fast/slow/dead classification - one
   * pass over sales and stock data rather than N+1 queries per item.
   */
  private async computeItemVelocity(): Promise<ItemVelocity[]> {
    const [items, stockAgg, salesRows] = await Promise.all([
      this.prisma.item.findMany({
        where: { isActive: true },
        include: { category: true },
      }),
      this.prisma.warehouseStock.groupBy({
        by: ['itemId'],
        _sum: { quantity: true },
      }),
      this.prisma.salesBillItem.findMany({
        select: {
          itemId: true,
          qty: true,
          salesBill: { select: { billDate: true } },
        },
      }),
    ]);

    const stockMap = new Map<string, number>();
    for (const row of stockAgg) {
      stockMap.set(row.itemId, Number(row._sum.quantity || 0));
    }

    const cutoff = Date.now() - VELOCITY_WINDOW_DAYS * DAY_MS;

    const salesWindowMap = new Map<string, number>();
    const lastSoldMap = new Map<string, number>();

    for (const row of salesRows) {
      const billTime = row.salesBill.billDate.getTime();

      if (billTime >= cutoff) {
        salesWindowMap.set(
          row.itemId,
          (salesWindowMap.get(row.itemId) || 0) +
            Number(row.qty),
        );
      }

      const lastSold = lastSoldMap.get(row.itemId) || 0;
      if (billTime > lastSold) {
        lastSoldMap.set(row.itemId, billTime);
      }
    }

    return items.map((item) => {
      const currentStock = stockMap.get(item.id) || 0;
      const qtySoldLast90Days =
        salesWindowMap.get(item.id) || 0;
      const avgDailySales =
        qtySoldLast90Days / VELOCITY_WINDOW_DAYS;
      const lastSoldTime = lastSoldMap.get(item.id) || null;

      const daysOfCover =
        avgDailySales > 0
          ? Number(
              (currentStock / avgDailySales).toFixed(1),
            )
          : null;

      const classification: ItemVelocity['classification'] =
        qtySoldLast90Days === 0
          ? 'DEAD'
          : daysOfCover !== null &&
              daysOfCover < FAST_MOVER_COVER_THRESHOLD_DAYS
            ? 'FAST'
            : 'SLOW';

      return {
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        categoryId: item.categoryId,
        categoryName: item.category.name,
        currentStock,
        qtySoldLast90Days: Number(
          qtySoldLast90Days.toFixed(2),
        ),
        avgDailySales: Number(avgDailySales.toFixed(3)),
        daysOfCover,
        lastSoldDate: lastSoldTime
          ? new Date(lastSoldTime).toISOString()
          : null,
        classification,
      };
    });
  }

  async stockVelocity() {
    const velocity = await this.computeItemVelocity();

    const classOrder = { DEAD: 0, SLOW: 1, FAST: 2 };

    return velocity.sort((a, b) => {
      const orderDiff =
        classOrder[a.classification] -
        classOrder[b.classification];
      if (orderDiff !== 0) return orderDiff;

      if (a.classification === 'FAST') {
        return (a.daysOfCover ?? 0) - (b.daysOfCover ?? 0);
      }

      return b.currentStock - a.currentStock;
    });
  }

  async reorderRecommendations(
    leadTimeDays: number = DEFAULT_LEAD_TIME_DAYS,
    coverDays: number = DEFAULT_COVER_DAYS,
  ) {
    const velocity = await this.computeItemVelocity();

    return velocity
      .filter((row) => row.avgDailySales > 0)
      .map((row) => {
        const reorderPoint = Number(
          (row.avgDailySales * leadTimeDays).toFixed(2),
        );

        const targetStock = Number(
          (row.avgDailySales * coverDays).toFixed(2),
        );

        const recommendedQty = Math.max(
          0,
          Math.ceil(targetStock - row.currentStock),
        );

        return {
          itemId: row.itemId,
          itemCode: row.itemCode,
          itemName: row.itemName,
          categoryName: row.categoryName,
          currentStock: row.currentStock,
          avgDailySales: row.avgDailySales,
          daysOfCover: row.daysOfCover,
          reorderPoint,
          leadTimeDays,
          coverDays,
          recommendedQty,
        };
      })
      .filter(
        (row) =>
          row.currentStock <= row.reorderPoint &&
          row.recommendedQty > 0,
      )
      .sort(
        (a, b) => (a.daysOfCover ?? 0) - (b.daysOfCover ?? 0),
      );
  }

  /*
   * A simple ordinary-least-squares linear trend fitted over the
   * trailing `historyDays` of daily net sales, projected `days`
   * ahead. This is a transparent trend line, not a seasonal or
   * machine-learned forecast - it will not anticipate weekly
   * patterns, promotions, or holidays.
   */
  async salesForecast(
    days: number = 14,
    historyDays: number = 60,
  ) {
    const today = new Date(
      `${new Date().toISOString().slice(0, 10)}T00:00:00.000Z`,
    );

    const start = new Date(
      today.getTime() - (historyDays - 1) * DAY_MS,
    );

    const bills = await this.prisma.salesBill.findMany({
      where: { billDate: { gte: start } },
      select: { billDate: true, netAmount: true },
    });

    const dailyTotals = new Map<string, number>();

    for (let i = 0; i < historyDays; i++) {
      const day = new Date(start.getTime() + i * DAY_MS)
        .toISOString()
        .slice(0, 10);
      dailyTotals.set(day, 0);
    }

    for (const bill of bills) {
      const day = bill.billDate.toISOString().slice(0, 10);
      if (dailyTotals.has(day)) {
        dailyTotals.set(
          day,
          (dailyTotals.get(day) || 0) +
            Number(bill.netAmount),
        );
      }
    }

    const history = Array.from(dailyTotals.entries()).map(
      ([date, actual], index) => ({
        date,
        actual: Number(actual.toFixed(2)),
        index,
      }),
    );

    const n = history.length;
    const sumX = history.reduce((s, r) => s + r.index, 0);
    const sumY = history.reduce((s, r) => s + r.actual, 0);
    const sumXY = history.reduce(
      (s, r) => s + r.index * r.actual,
      0,
    );
    const sumX2 = history.reduce(
      (s, r) => s + r.index * r.index,
      0,
    );

    const denominator = n * sumX2 - sumX * sumX;
    const slope =
      denominator !== 0
        ? (n * sumXY - sumX * sumY) / denominator
        : 0;
    const intercept = (sumY - slope * sumX) / n;

    const forecast = Array.from(
      { length: days },
      (_, i) => {
        const index = n + i;
        const date = new Date(
          today.getTime() + (i + 1) * DAY_MS,
        )
          .toISOString()
          .slice(0, 10);

        return {
          date,
          projected: Number(
            Math.max(
              0,
              intercept + slope * index,
            ).toFixed(2),
          ),
        };
      },
    );

    return {
      method:
        'linear-trend (ordinary least squares over trailing history; no seasonality)',
      historyDays,
      history: history.map(({ date, actual }) => ({
        date,
        actual,
      })),
      forecast,
      projectedTotal: Number(
        forecast
          .reduce((s, r) => s + r.projected, 0)
          .toFixed(2),
      ),
      dailyTrendPerDay: Number(slope.toFixed(2)),
    };
  }

  async categoryPerformance(days: number = 30) {
    const cutoff = new Date(Date.now() - days * DAY_MS);

    const items = await this.prisma.salesBillItem.findMany({
      where: { salesBill: { billDate: { gte: cutoff } } },
      include: {
        item: { include: { category: true } },
        batch: true,
      },
    });

    const map = new Map<
      string,
      {
        categoryId: string;
        categoryName: string;
        qtySold: number;
        salesValue: number;
        costValue: number;
        itemIds: Set<string>;
      }
    >();

    for (const row of items) {
      const categoryId = row.item.categoryId;

      if (!map.has(categoryId)) {
        map.set(categoryId, {
          categoryId,
          categoryName: row.item.category.name,
          qtySold: 0,
          salesValue: 0,
          costValue: 0,
          itemIds: new Set(),
        });
      }

      const bucket = map.get(categoryId)!;
      const qty = Number(row.qty);

      bucket.qtySold += qty;
      bucket.salesValue += Number(row.netAmount);
      bucket.costValue += qty * Number(row.batch.purchaseRate);
      bucket.itemIds.add(row.itemId);
    }

    return Array.from(map.values())
      .map((row) => {
        const profit = row.salesValue - row.costValue;

        return {
          categoryId: row.categoryId,
          categoryName: row.categoryName,
          itemCount: row.itemIds.size,
          qtySold: Number(row.qtySold.toFixed(2)),
          salesValue: Number(row.salesValue.toFixed(2)),
          costValue: Number(row.costValue.toFixed(2)),
          profit: Number(profit.toFixed(2)),
          marginPercent:
            row.salesValue > 0
              ? Number(
                  (
                    (profit / row.salesValue) *
                    100
                  ).toFixed(1),
                )
              : 0,
        };
      })
      .sort((a, b) => b.salesValue - a.salesValue);
  }

  async trendAnalysis(periodDays: number = 30) {
    const now = Date.now();
    const currentStart = new Date(
      now - periodDays * DAY_MS,
    );
    const previousStart = new Date(
      now - periodDays * 2 * DAY_MS,
    );

    const [
      currentSales,
      previousSales,
      currentPurchases,
      previousPurchases,
    ] = await Promise.all([
      this.prisma.salesBill.findMany({
        where: { billDate: { gte: currentStart } },
        include: { items: { include: { batch: true } } },
      }),
      this.prisma.salesBill.findMany({
        where: {
          billDate: {
            gte: previousStart,
            lt: currentStart,
          },
        },
        include: { items: { include: { batch: true } } },
      }),
      this.prisma.purchaseBill.aggregate({
        where: {
          billDate: { gte: currentStart },
          status: 'ACTIVE',
        },
        _sum: { netAmount: true },
      }),
      this.prisma.purchaseBill.aggregate({
        where: {
          billDate: {
            gte: previousStart,
            lt: currentStart,
          },
          status: 'ACTIVE',
        },
        _sum: { netAmount: true },
      }),
    ]);

    const summarize = (
      bills: typeof currentSales,
    ) => {
      let salesValue = 0;
      let costValue = 0;
      const customerIds = new Set<string>();

      for (const bill of bills) {
        salesValue += Number(bill.netAmount);
        if (bill.customerId) customerIds.add(bill.customerId);

        for (const line of bill.items) {
          costValue +=
            Number(line.qty) *
            Number(line.batch.purchaseRate);
        }
      }

      return {
        billCount: bills.length,
        salesValue: Number(salesValue.toFixed(2)),
        grossProfit: Number(
          (salesValue - costValue).toFixed(2),
        ),
        customerCount: customerIds.size,
      };
    };

    const current = {
      ...summarize(currentSales),
      purchaseValue: Number(
        (
          currentPurchases._sum.netAmount || 0
        ).toFixed(2),
      ),
    };

    const previous = {
      ...summarize(previousSales),
      purchaseValue: Number(
        (
          previousPurchases._sum.netAmount || 0
        ).toFixed(2),
      ),
    };

    const growth = (curr: number, prev: number) => {
      if (prev === 0) return curr > 0 ? 100 : 0;
      return Number(
        (((curr - prev) / prev) * 100).toFixed(1),
      );
    };

    return {
      periodDays,
      current,
      previous,
      growth: {
        salesValue: growth(
          current.salesValue,
          previous.salesValue,
        ),
        grossProfit: growth(
          current.grossProfit,
          previous.grossProfit,
        ),
        purchaseValue: growth(
          current.purchaseValue,
          previous.purchaseValue,
        ),
        billCount: growth(
          current.billCount,
          previous.billCount,
        ),
        customerCount: growth(
          current.customerCount,
          previous.customerCount,
        ),
      },
    };
  }
}
