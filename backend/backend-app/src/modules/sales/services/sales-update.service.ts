import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import { LedgerService } from '../../ledger/ledger.service';

import { CreateSalesDto } from '../dto/create-sales.dto';

import { SalesStockService } from './sales-stock.service';
import { SalesCalculationService } from './sales-calculation.service';

@Injectable()
export class SalesUpdateService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stockService: SalesStockService,
    private readonly calculationService: SalesCalculationService,
    private readonly ledgerService: LedgerService,
  ) {}

  async updateSales(
    salesBillId: string,
    dto: CreateSalesDto,
    permissions: string[] = [],
  ) {
    if (!salesBillId?.trim()) {
      throw new Error(
        'Sales bill ID is required.',
      );
    }

    if (!dto.billDate) {
      throw new Error(
        'Bill date is required.',
      );
    }

    if (!dto.warehouseId) {
      throw new Error(
        'Warehouse is required.',
      );
    }

    if (
      !dto.items ||
      dto.items.length === 0
    ) {
      throw new Error(
        'At least one sales item is required.',
      );
    }

    return this.prisma.$transaction(
      async (tx) => {
        const existingBill =
          await tx.salesBill.findUnique({
            where: {
              id: salesBillId,
            },
            include: {
              items: true,
              payments: true,
              saleReturns: true,
            },
          });

        if (!existingBill) {
          throw new NotFoundException(
            'Sales bill not found.',
          );
        }

        if (
          existingBill.saleReturns.length >
          0
        ) {
          throw new Error(
            'This sales bill cannot be edited because a Sales Return already exists for it.',
          );
        }

        // =====================================================
        // REVERSE OLD STOCK
        // =====================================================

        for (
          const oldItem of existingBill.items
        ) {
          await this.stockService.reverseStock(
            oldItem.itemId,
            oldItem.batchId,
            existingBill.warehouseId,
            Number(oldItem.qty),
            existingBill.id,
            tx,
          );
        }

        // =====================================================
        // REMOVE OLD CUSTOMER LEDGER
        // =====================================================

        await tx.ledgerEntry.deleteMany({
          where: {
            referenceId:
              existingBill.id,
            referenceType:
              'SALE',
            transactionType:
              'SALE',
          },
        });

        // =====================================================
        // CALCULATE NEW SALE
        // =====================================================

        const calculation =
          await this.calculationService.calculate(
            dto,
            tx,
            permissions,
          );

        const {
          itemCalculations,
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

        // =====================================================
        // NORMALIZE PAYMENTS
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

                  cardSurcharge:
                    Number(
                      payment.cardSurcharge ||
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

                  cardSurcharge: 0,

                  transactionNo:
                    undefined,

                  remarks:
                    'Legacy payment',
                },
              ];

        // =====================================================
        // PAYMENT VALIDATION
        // =====================================================

        const allowedModes = [
          'CASH',
          'UPI',
          'CARD',
          'CREDIT',
        ];

        let paymentAmount = 0;
        let cardSurchargeTotal = 0;
        let creditAmount = 0;

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
              'Payment amount must be zero or greater.',
            );
          }

          if (
            payment.cardSurcharge < 0
          ) {
            throw new Error(
              'Card surcharge cannot be negative.',
            );
          }

          if (
            payment.cardSurcharge > 0 &&
            payment.paymentMode !==
              'CARD'
          ) {
            throw new Error(
              'Card surcharge is allowed only for CARD payments.',
            );
          }

          paymentAmount +=
            payment.amount;

          cardSurchargeTotal +=
            payment.cardSurcharge;

          if (
            payment.paymentMode ===
            'CREDIT'
          ) {
            creditAmount +=
              payment.amount;
          }
        }

        const payableAmount =
          Number(
            (
              finalPayable +
              cardSurchargeTotal
            ).toFixed(2),
          );

        const paymentDifference =
          Number(
            (
              paymentAmount -
              payableAmount
            ).toFixed(2),
          );

        if (
          Math.abs(
            paymentDifference,
          ) > 0.01
        ) {
          throw new Error(
            `Payment total mismatch. Bill: ${payableAmount.toFixed(
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
        // UPDATE SALES BILL
        // =====================================================

        await tx.salesBill.update({
          where: {
            id: existingBill.id,
          },

            data: {
              billNo:
                existingBill.billNo,

            billDate:
              dto.billDate,

            customerId:
              dto.customerId ||
              null,

            warehouseId:
              dto.warehouseId,

            salesmanId:
              dto.salesmanId ||
              null,

            grossAmount,

            itemDiscountAmount:
              totalItemDiscount,

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
        // DELETE OLD ITEMS
        // =====================================================

        await tx.salesBillItem.deleteMany({
          where: {
            salesBillId:
              existingBill.id,
          },
        });

        // =====================================================
        // DELETE OLD PAYMENTS
        // =====================================================

        await tx.salesPayment.deleteMany({
          where: {
            salesBillId:
              existingBill.id,
          },
        });

        // =====================================================
        // CREATE NEW ITEMS + STOCK
        // =====================================================

        for (
          const row of itemCalculations
        ) {
          await tx.salesBillItem.create({
            data: {
              salesBillId:
                existingBill.id,

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
            existingBill.id,
            tx,
          );
        }

        // =====================================================
        // CREATE NEW PAYMENTS
        // =====================================================

        for (
          const payment of payments
        ) {
          if (
            payment.amount <= 0 &&
            payment.cardSurcharge <=
              0
          ) {
            continue;
          }

          await tx.salesPayment.create({
            data: {
              salesBillId:
                existingBill.id,

              paymentMode:
                payment.paymentMode,

              amount:
                payment.amount,

              cardSurcharge:
                payment.cardSurcharge,

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
        // CREATE NEW CUSTOMER LEDGER
        // =====================================================

        if (
          creditAmount > 0 &&
          dto.customerId
        ) {
          await this.ledgerService.postSales(
            dto.customerId,
            creditAmount,
            existingBill.id,
            tx,
          );
        }

        // =====================================================
        // RETURN UPDATED BILL
        // =====================================================

        return tx.salesBill.findUnique({
          where: {
            id: existingBill.id,
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
