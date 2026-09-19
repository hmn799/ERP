import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { AuditActor } from '../audit/audit.service';

import { QueryAlertsDto } from './dto/query-alerts.dto';

export type AlertCategory =
  | 'JOB_FAILURE'
  | 'BACKUP_FAILURE'
  | 'SLOW_QUERY'
  | 'TRANSACTION_ERROR'
  | 'RECONCILIATION_EXCEPTION'
  | 'LOW_STOCK'
  | 'OVERDUE_RECEIVABLE'
  | 'SCHEME_EXPIRY';

export type AlertSeverity = 'WARNING' | 'CRITICAL';

export const BUSINESS_ALERT_CATEGORIES: AlertCategory[] = [
  'LOW_STOCK',
  'OVERDUE_RECEIVABLE',
  'SCHEME_EXPIRY',
];

const RECONCILIATION_EPSILON = 0.01;

@Injectable()
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);

  constructor(private readonly prisma: PrismaService) {}

  async recordAlert(
    category: AlertCategory,
    severity: AlertSeverity,
    message: string,
    details?: Record<string, unknown> | null,
    source?: string,
  ) {
    try {
      await this.prisma.systemAlert.create({
        data: {
          category,
          severity,
          message,
          source: source ?? null,
          details: (details ?? undefined) as Prisma.InputJsonValue,
        },
      });
    } catch (error) {
      // Alerting must never break the operation that triggered it.
      this.logger.error(
        `Failed to record alert (${category}): ${error}`,
      );
    }
  }

  async listAlerts(query: QueryAlertsDto) {
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 25;

    const where: Prisma.SystemAlertWhereInput = {
      category: query.category || undefined,
      severity: query.severity || undefined,
      acknowledgedAt:
        query.acknowledged === undefined
          ? undefined
          : query.acknowledged === 'true'
            ? { not: null }
            : null,
    };

    const [total, items] = await Promise.all([
      this.prisma.systemAlert.count({ where }),
      this.prisma.systemAlert.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * pageSize,
        take: pageSize,
      }),
    ]);

    return { items, total, page, pageSize };
  }

  async summary() {
    const open = await this.prisma.systemAlert.groupBy({
      by: ['category', 'severity'],
      where: { acknowledgedAt: null },
      _count: { _all: true },
    });

    return open.map((row) => ({
      category: row.category,
      severity: row.severity,
      count: row._count._all,
    }));
  }

  async acknowledgeAlert(id: string, actor?: AuditActor) {
    const alert = await this.prisma.systemAlert.findUnique({
      where: { id },
    });

    if (!alert) {
      throw new NotFoundException('Alert not found.');
    }

    return this.prisma.systemAlert.update({
      where: { id },
      data: {
        acknowledgedAt: new Date(),
        acknowledgedById: actor?.id ?? null,
        acknowledgedByName: actor?.name ?? null,
      },
    });
  }

  // =========================================================
  // BUSINESS ALERTS
  //
  // Unlike the technical alerts above (job failures, slow
  // queries, reconciliation), these are meant for regular
  // staff, not just admins with VIEW_MONITORING - see
  // AlertsController, which exposes them without that gate.
  // =========================================================

  async listBusinessAlerts() {
    return this.prisma.systemAlert.findMany({
      where: {
        category: { in: BUSINESS_ALERT_CATEGORIES },
        acknowledgedAt: null,
      },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  /*
   * Acknowledges an alert only if it's one of the business
   * categories - called from the unguarded AlertsController, so
   * this stops that route being used to silently dismiss a
   * technical alert (JOB_FAILURE, etc.) that's meant to require
   * VIEW_MONITORING.
   */
  async acknowledgeBusinessAlert(id: string, actor?: AuditActor) {
    const alert = await this.prisma.systemAlert.findUnique({
      where: { id },
    });

    if (
      !alert ||
      !BUSINESS_ALERT_CATEGORIES.includes(
        alert.category as AlertCategory,
      )
    ) {
      throw new NotFoundException('Alert not found.');
    }

    return this.acknowledgeAlert(id, actor);
  }

  async generateBusinessAlerts() {
    await this.generateLowStockAlerts();
    await this.generateOverdueReceivableAlerts();
    await this.generateSchemeExpiryAlerts();
  }

  /*
   * Only for items that opted in with a real reorder floor
   * (minQty > 0) - matches the existing reorder-tracking
   * design (see Item.minQty/reorderQty), rather than an
   * arbitrary fixed threshold.
   */
  private async generateLowStockAlerts() {
    const items = await this.prisma.item.findMany({
      where: { isActive: true, minQty: { gt: 0 } },
    });

    for (const item of items) {
      const entries = await this.prisma.stockLedger.findMany({
        where: { itemId: item.id },
      });

      let qtyIn = 0;
      let qtyOut = 0;

      for (const row of entries) {
        qtyIn += Number(row.qtyIn);
        qtyOut += Number(row.qtyOut);
      }

      const stock = qtyIn - qtyOut;
      const minQty = Number(item.minQty);

      if (stock > minQty) {
        continue;
      }

      const existing = await this.prisma.systemAlert.findFirst({
        where: {
          category: 'LOW_STOCK',
          source: item.id,
          acknowledgedAt: null,
        },
      });

      if (existing) {
        continue;
      }

      await this.recordAlert(
        'LOW_STOCK',
        'WARNING',
        `${item.name} (${item.itemCode}) is at ${stock}, at or below its reorder floor of ${minQty}.`,
        { itemId: item.id, stock, minQty },
        item.id,
      );
    }
  }

  /*
   * Only for customers with a credit limit set (creditLimit >
   * 0) - opt-in, same convention as the low-stock check above.
   * "Overdue" here means over the limit, not date-based, since
   * bills don't carry a due date to compare against.
   */
  private async generateOverdueReceivableAlerts() {
    const customers = await this.prisma.customer.findMany({
      where: { isActive: true, creditLimit: { gt: 0 } },
    });

    for (const customer of customers) {
      const rows = await this.prisma.ledgerEntry.findMany({
        where: { partyType: 'CUSTOMER', partyId: customer.id },
      });

      let debit = 0;
      let credit = 0;

      for (const row of rows) {
        debit += Number(row.debitAmount);
        credit += Number(row.creditAmount);
      }

      const outstanding = debit - credit;
      const creditLimit = Number(customer.creditLimit);

      if (outstanding <= creditLimit) {
        continue;
      }

      const existing = await this.prisma.systemAlert.findFirst({
        where: {
          category: 'OVERDUE_RECEIVABLE',
          source: customer.id,
          acknowledgedAt: null,
        },
      });

      if (existing) {
        continue;
      }

      await this.recordAlert(
        'OVERDUE_RECEIVABLE',
        'WARNING',
        `${customer.name} owes ${outstanding.toFixed(2)}, over their credit limit of ${creditLimit.toFixed(2)}.`,
        { customerId: customer.id, outstanding, creditLimit },
        customer.id,
      );
    }
  }

  private async generateSchemeExpiryAlerts() {
    const now = new Date();
    const soon = new Date();
    soon.setDate(soon.getDate() + 7);

    const schemes = await this.prisma.scheme.findMany({
      where: {
        isActive: true,
        effectiveTo: { not: null, lte: soon, gte: now },
      },
    });

    for (const scheme of schemes) {
      const existing = await this.prisma.systemAlert.findFirst({
        where: {
          category: 'SCHEME_EXPIRY',
          source: scheme.id,
          acknowledgedAt: null,
        },
      });

      if (existing) {
        continue;
      }

      await this.recordAlert(
        'SCHEME_EXPIRY',
        'WARNING',
        `Scheme "${scheme.name}" expires on ${scheme.effectiveTo?.toLocaleDateString('en-IN')}.`,
        { schemeId: scheme.id, effectiveTo: scheme.effectiveTo },
        scheme.id,
      );
    }
  }

  /*
   * Runs daily at 8 AM. Any crash of the checks themselves is
   * recorded as a JOB_FAILURE, same convention as the
   * reconciliation cron below.
   */
  @Cron('0 8 * * *')
  async runScheduledBusinessAlerts() {
    try {
      await this.generateBusinessAlerts();
    } catch (error: any) {
      await this.recordAlert(
        'JOB_FAILURE',
        'CRITICAL',
        `Business alert generation crashed: ${error?.message || error}`,
        undefined,
        'business-alerts-cron',
      );
    }
  }

  /*
   * Runs at 3 AM, an hour after the nightly backup. Any crash of the
   * check itself (not a mismatch it finds - that's a
   * RECONCILIATION_EXCEPTION) is recorded as a JOB_FAILURE.
   */
  @Cron('0 3 * * *')
  async runScheduledReconciliation() {
    try {
      await this.runReconciliationCheck();
    } catch (error: any) {
      await this.recordAlert(
        'JOB_FAILURE',
        'CRITICAL',
        `Scheduled reconciliation check crashed: ${error?.message || error}`,
        undefined,
        'reconciliation-cron',
      );
    }
  }

  async runReconciliationCheck() {
    const exceptions: Array<{
      type: string;
      details: Record<string, unknown>;
    }> = [];

    await this.checkStockReconciliation(exceptions);
    await this.checkPurchaseLedgerReconciliation(exceptions);
    await this.checkSalesLedgerReconciliation(exceptions);

    for (const exception of exceptions) {
      await this.recordAlert(
        'RECONCILIATION_EXCEPTION',
        'CRITICAL',
        this.exceptionMessage(exception),
        exception.details,
        'reconciliation-check',
      );
    }

    return {
      checkedAt: new Date().toISOString(),
      exceptionCount: exceptions.length,
      exceptions,
    };
  }

  private exceptionMessage(exception: {
    type: string;
    details: Record<string, unknown>;
  }): string {
    switch (exception.type) {
      case 'STOCK_MISMATCH':
        return `Stock mismatch for item ${exception.details.itemId} / batch ${exception.details.batchId}: warehouse shows ${exception.details.warehouseStockQty}, stock ledger nets to ${exception.details.stockLedgerNet}.`;
      case 'PURCHASE_LEDGER_MISMATCH':
        return `Purchase ${exception.details.billNo} posted ${exception.details.posted} to the supplier ledger but its net amount is ${exception.details.expected}.`;
      case 'SALES_LEDGER_MISMATCH':
        return `Sale ${exception.details.billNo} posted ${exception.details.posted} to the customer ledger but its credit payments total ${exception.details.expected}.`;
      default:
        return 'Reconciliation exception found.';
    }
  }

  private async checkStockReconciliation(
    exceptions: Array<{
      type: string;
      details: Record<string, unknown>;
    }>,
  ) {
    const [stockRows, ledgerAgg] = await Promise.all([
      this.prisma.warehouseStock.findMany(),
      this.prisma.stockLedger.groupBy({
        by: ['itemId', 'batchId', 'warehouseId'],
        _sum: { qtyIn: true, qtyOut: true },
      }),
    ]);

    const ledgerMap = new Map<string, number>();

    for (const row of ledgerAgg) {
      const key = `${row.itemId}:${row.batchId}:${row.warehouseId}`;
      const net =
        Number(row._sum.qtyIn || 0) -
        Number(row._sum.qtyOut || 0);
      ledgerMap.set(key, net);
    }

    for (const stock of stockRows) {
      const key = `${stock.itemId}:${stock.batchId}:${stock.warehouseId}`;
      const ledgerNet = ledgerMap.get(key) ?? 0;
      const stockQty = Number(stock.quantity);

      if (
        Math.abs(stockQty - ledgerNet) >
        RECONCILIATION_EPSILON
      ) {
        exceptions.push({
          type: 'STOCK_MISMATCH',
          details: {
            warehouseId: stock.warehouseId,
            itemId: stock.itemId,
            batchId: stock.batchId,
            warehouseStockQty: stockQty,
            stockLedgerNet: ledgerNet,
            difference: stockQty - ledgerNet,
          },
        });
      }
    }
  }

  private async checkPurchaseLedgerReconciliation(
    exceptions: Array<{
      type: string;
      details: Record<string, unknown>;
    }>,
  ) {
    const [activePurchases, purchaseLedgerAgg] =
      await Promise.all([
        this.prisma.purchaseBill.findMany({
          where: { status: 'ACTIVE' },
        }),
        this.prisma.ledgerEntry.groupBy({
          by: ['referenceId'],
          where: { referenceType: 'PURCHASE' },
          _sum: { creditAmount: true },
        }),
      ]);

    const postedMap = new Map<string, number>();

    for (const row of purchaseLedgerAgg) {
      if (!row.referenceId) continue;
      postedMap.set(
        row.referenceId,
        Number(row._sum.creditAmount || 0),
      );
    }

    for (const bill of activePurchases) {
      const posted = postedMap.get(bill.id) ?? 0;
      const expected = Number(bill.netAmount);

      if (
        Math.abs(posted - expected) >
        RECONCILIATION_EPSILON
      ) {
        exceptions.push({
          type: 'PURCHASE_LEDGER_MISMATCH',
          details: {
            purchaseBillId: bill.id,
            billNo: bill.billNo,
            expected,
            posted,
            difference: expected - posted,
          },
        });
      }
    }
  }

  private async checkSalesLedgerReconciliation(
    exceptions: Array<{
      type: string;
      details: Record<string, unknown>;
    }>,
  ) {
    const [creditSales, salesLedgerAgg, creditPaymentsAgg] =
      await Promise.all([
        this.prisma.salesBill.findMany({
          where: { isCredit: true },
        }),
        this.prisma.ledgerEntry.groupBy({
          by: ['referenceId'],
          where: { referenceType: 'SALE' },
          _sum: { debitAmount: true },
        }),
        this.prisma.salesPayment.groupBy({
          by: ['salesBillId'],
          where: { paymentMode: 'CREDIT' },
          _sum: { amount: true },
        }),
      ]);

    const postedMap = new Map<string, number>();

    for (const row of salesLedgerAgg) {
      if (!row.referenceId) continue;
      postedMap.set(
        row.referenceId,
        Number(row._sum.debitAmount || 0),
      );
    }

    const expectedMap = new Map<string, number>();

    for (const row of creditPaymentsAgg) {
      expectedMap.set(
        row.salesBillId,
        Number(row._sum.amount || 0),
      );
    }

    for (const bill of creditSales) {
      const posted = postedMap.get(bill.id) ?? 0;
      const expected = expectedMap.get(bill.id) ?? 0;

      if (
        Math.abs(posted - expected) >
        RECONCILIATION_EPSILON
      ) {
        exceptions.push({
          type: 'SALES_LEDGER_MISMATCH',
          details: {
            salesBillId: bill.id,
            billNo: bill.billNo,
            expected,
            posted,
            difference: expected - posted,
          },
        });
      }
    }
  }
}
