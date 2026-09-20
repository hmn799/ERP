import { Injectable } from '@nestjs/common';

import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

import { CreateSalesDto } from '../dto/create-sales.dto';

import { SalesStockService } from './sales-stock.service';
import { SalesGstService } from './sales-gst.service';
import { SalesCalculationService } from './sales-calculation.service';
import { LedgerService } from '../../ledger/ledger.service';
import { DocumentNumberService } from '../../../core/document-number/document-number.service';
import { DocumentType } from '../../../core/document-number/document-type.enum';
import { AuditService, AuditActor } from '../../audit/audit.service';
import { FinancialYearGuardService } from '../../financial-year/financial-year-guard.service';

@Injectable()
export class SalesSaveService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: SalesStockService,
    private readonly gstService: SalesGstService,
    private readonly ledgerService: LedgerService,
    private readonly calculationService: SalesCalculationService,
    private readonly documentNumberService: DocumentNumberService,
    private readonly auditService: AuditService,
    private readonly financialYearGuardService: FinancialYearGuardService,
  ) {}

  async saveSales(
    dto: CreateSalesDto,
    permissions: string[] = [],
    actor?: AuditActor,
  ) {
    if (!dto.billDate) {
      throw new Error(
        'Bill date is required',
      );
    }

    await this.financialYearGuardService.assertDateNotClosed(
      dto.billDate,
    );

    if (!dto.warehouseId) {
      throw new Error(
        'Warehouse is required',
      );
    }

    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new Error(
        'At least one sales item is required',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const billNo =
          await this.documentNumberService.nextInTransaction(
            DocumentType.SALES_BILL,
            tx,
          );

        // =====================================================
        // =====================================================
        // SHARED SALES CALCULATION
        // =====================================================

        const calculation =
          await this.calculationService.calculate(
            dto,
            tx,
            permissions,
          );

        const {
          customer,
          warehouse,
          itemCalculations,
          manualDiscountRequested,
          grossAmount,
          totalItemDiscount,
          billDiscountAmount,
          totalTaxable,
          totalCgst,
          totalSgst,
          totalIgst,
          netAmount,
          roundOff,
          shortAmount,
          finalPayable,
        } = calculation;

        // =====================================================        // PAYMENT NORMALIZATION
        // =====================================================

        const payments =
          dto.payments &&
          dto.payments.length > 0
            ? dto.payments.map(
                (payment) => ({
                  paymentMode:
                    payment.paymentMode.toUpperCase(),

                  amount:
                    Number(
                      payment.amount,
                    ),

                  surchargeType:
                    payment.surchargeType?.toUpperCase() ===
                    'PERCENT'
                      ? 'PERCENT'
                      : 'AMOUNT',

                  surchargeValue:
                    Number(
                      payment.surchargeValue ||
                        0,
                    ),

                  transactionNo:
                    payment.transactionNo,

                  remarks:
                    payment.remarks,
                }),
              )
            : [
                {
                  paymentMode:
                    dto.isCredit
                      ? 'CREDIT'
                      : 'CASH',

                  amount:
                    finalPayable,

                  surchargeType:
                    'AMOUNT',

                  surchargeValue: 0,

                  transactionNo:
                    undefined,

                  remarks:
                    'Legacy payment',
                },
              ];

        // =====================================================
        // PAYMENT VALIDATION
        //
        // Surcharge is resolved server-side (never trusted from the
        // client) - AMOUNT is used as-is, PERCENT is applied against
        // that same row's own `amount`.
        // =====================================================

        const allowedModes = [
          'CASH',
          'UPI',
          'CARD',
          'CREDIT',
        ];

        let paymentAmount = 0;
        let creditAmount = 0;

        const resolvedPayments: Array<{
          paymentMode: string;
          amount: number;
          surchargeType: string;
          surchargeValue: number;
          transactionNo: string | undefined;
          remarks: string | undefined;
          surchargeAmount: number;
        }> = [];

        for (
          const payment of payments
        ) {
          if (
            !allowedModes.includes(
              payment.paymentMode,
            )
          ) {
            throw new Error(
              `Invalid payment mode: ${payment.paymentMode}`,
            );
          }

          if (
            !Number.isFinite(
              payment.amount,
            ) ||
            payment.amount < 0
          ) {
            throw new Error(
              'Payment amount must be zero or greater',
            );
          }

          if (
            payment.surchargeValue < 0
          ) {
            throw new Error(
              'Surcharge cannot be negative',
            );
          }

          const surchargeAmount =
            Number(
              (
                payment.surchargeType ===
                'PERCENT'
                  ? (payment.amount *
                      payment.surchargeValue) /
                    100
                  : payment.surchargeValue
              ).toFixed(2),
            );

          resolvedPayments.push({
            ...payment,
            surchargeAmount,
          });

          paymentAmount +=
            payment.amount;

          if (
            payment.paymentMode ===
            'CREDIT'
          ) {
            creditAmount +=
              payment.amount;
          }
        }

        // =====================================================
        // PAYMENT MUST MATCH FINAL PAYABLE
        //
        // Surcharge is additive - money collected on top of the
        // bill (e.g. a card processing fee passed to the customer),
        // not part of covering it - so only the `amount` fields
        // (never surcharge) need to reconcile against finalPayable.
        // Cash received / change is handled by frontend. Database
        // stores only actual amount applied to the bill.
        // =====================================================

        const paymentDifference =
          Number(
            (
              paymentAmount -
              finalPayable
            ).toFixed(2),
          );

        if (
          Math.abs(
            paymentDifference,
          ) > 0.01
        ) {
          throw new Error(
            `Payment total mismatch. Bill: ${finalPayable.toFixed(
              2,
            )}, Payment: ${paymentAmount.toFixed(
              2,
            )}`,
          );
        }

        // =====================================================
        // CREDIT VALIDATION
        // =====================================================

        if (
          creditAmount > 0 &&
          !dto.customerId
        ) {
          throw new Error(
            'Customer is required when using CREDIT payment.',
          );
        }

        const hasCredit =
          creditAmount > 0;

        if (
          dto.isCredit === true &&
          !hasCredit
        ) {
          throw new Error(
            'Credit Sale requires a CREDIT payment.',
          );
        }

        // =====================================================
        // CREATE SALES BILL
        // =====================================================

        const salesBill =
          await tx.salesBill.create({
            data: {
              billNo:
                billNo,

              billDate:
                dto.billDate,

              customerId:
                dto.customerId || null,

              warehouseId:
                dto.warehouseId,

              salesmanId:
                dto.salesmanId || null,

              taxMode:
                dto.taxMode ?? 'EXCLUSIVE',

              grossAmount,

              itemDiscountAmount:
                totalItemDiscount,

              billDiscountAmount:
                billDiscountAmount,

              taxableAmount:
                totalTaxable,

              cgstAmount:
                totalCgst,

              sgstAmount:
                totalSgst,

              igstAmount:
                totalIgst,

              netAmount,

              roundOff,

              shortAmount,

              finalPayable,

              isCredit:
                hasCredit,
            },
          });

        // =====================================================
        // CREATE SALES ITEMS + STOCK
        // =====================================================

        for (
          const row of itemCalculations
        ) {
          await tx.salesBillItem.create({
            data: {
              salesBillId:
                salesBill.id,

              itemId:
                row.item.itemId,

              batchId:
                row.item.batchId,

              qty:
                row.item.qty,

              saleRate:
                row.saleRate,

              discountPercent:
                row.item
                  .discountPercent ||
                0,

              gstPercent:
                row.gstPercent,

              taxableAmount:
                row.finalTaxable,

              cgstAmount:
                row.finalCgst,

              sgstAmount:
                row.finalSgst,

              igstAmount:
                row.finalIgst,

              netAmount:
                row.finalNetAmount,

              freeQty:
                row.freeQty || 0,

              schemeId:
                row.schemeId ||
                undefined,
            },
          });

          await this.stockService.postStock(
            row.item.itemId,
            row.item.batchId,
            dto.warehouseId,
            row.item.qty,
            salesBill.id,
            tx,
          );
        }

        // =====================================================
        // CREATE PAYMENT RECORDS
        // =====================================================

        for (
          const payment of resolvedPayments
        ) {
          if (
            payment.amount <= 0 &&
            payment.surchargeAmount <=
              0
          ) {
            continue;
          }

          await tx.salesPayment.create({
            data: {
              salesBillId:
                salesBill.id,

              paymentMode:
                payment.paymentMode,

              amount:
                payment.amount,

              surchargeType:
                payment.surchargeType,

              surchargeValue:
                payment.surchargeValue,

              surchargeAmount:
                payment.surchargeAmount,

              transactionNo:
                payment.transactionNo ||
                null,

              remarks:
                payment.remarks ||
                null,
            },
          });
        }

        // =====================================================
        // CUSTOMER LEDGER
        //
        // ONLY THE CREDIT PORTION becomes
        // customer outstanding.
        // =====================================================

        if (
          creditAmount > 0 &&
          salesBill.customerId
        ) {
          await this.ledgerService.postSales(
            salesBill.customerId,
            creditAmount,
            salesBill.id,
            tx,
          );
        }

        // =====================================================
        // CUSTOMER LEDGER - SHORT AMOUNT
        //
        // Posted as its own distinct entry (not folded into the
        // SALE/credit entry above) so it stays traceable to this
        // specific bill. Only possible when there's a customer to
        // post it against - a walk-in/anonymous sale has no ledger.
        // =====================================================

        if (
          shortAmount > 0 &&
          salesBill.customerId
        ) {
          await this.ledgerService.postSalesShortAmount(
            salesBill.customerId,
            shortAmount,
            salesBill.id,
            billNo,
            tx,
          );
        }

        // =====================================================
        // AUDIT: RATE OVERRIDE / MANUAL DISCOUNT
        // =====================================================

        const overriddenItems = itemCalculations
          .filter((row) => row.hasManualOverride)
          .map((row) => ({
            itemId: row.item.itemId,
            batchId: row.item.batchId,
            saleRate: row.saleRate,
          }));

        if (overriddenItems.length > 0) {
          await this.auditService.record(tx, {
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'RATE_OVERRIDE',
            entityType: 'SalesBill',
            entityId: salesBill.id,
            details: {
              billNo,
              items: overriddenItems,
            },
          });
        }

        if (manualDiscountRequested) {
          await this.auditService.record(tx, {
            actorId: actor?.id,
            actorName: actor?.name,
            action: 'DISCOUNT_APPLIED',
            entityType: 'SalesBill',
            entityId: salesBill.id,
            details: {
              billNo,
              billDiscountPercent: dto.billDiscountPercent || 0,
              itemDiscounts: itemCalculations
                .filter((row) => Number(row.item.discountPercent || 0) > 0)
                .map((row) => ({
                  itemId: row.item.itemId,
                  batchId: row.item.batchId,
                  discountPercent: row.item.discountPercent,
                })),
            },
          });
        }

        // =====================================================
        // RETURN CREATED BILL
        // =====================================================

        return tx.salesBill.findUnique({
          where: {
            id: salesBill.id,
          },

          include: {
            customer: true,
            salesman: true,
            warehouse: true,

            items: {
              include: {
                item: true,
                batch: true,
              },
            },

            payments: true,
          },
        });
      },
    );
  }
}

