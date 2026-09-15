import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { Prisma } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { LedgerService } from '../ledger/ledger.service';
import { DocumentNumberService } from '../../core/document-number/document-number.service';
import { DocumentType } from '../../core/document-number/document-type.enum';

import { CreateSaleReturnDto } from './dto/create-sale-return.dto';

@Injectable()
export class SaleReturnService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly documentNumberService: DocumentNumberService,
  ) {}

  async create(
    dto: CreateSaleReturnDto,
  ) {
    if (!dto.items?.length) {
      throw new BadRequestException(
        'At least one item is required for a sale return.',
      );
    }

    /*
     * =====================================================
     * REFUND PAYMENT VALIDATION
     * =====================================================
     *
     * A sale return must specify how the customer
     * is being compensated.
     *
     * Multiple payment modes are allowed.
     *
     * Example:
     *
     * CASH  = 5.00
     * UPI   = 5.62
     *
     * Total = 10.62
     */

    if (!dto.payments?.length) {
      throw new BadRequestException(
        'At least one refund payment is required for a sale return.',
      );
    }

    const allowedRefundModes = [
      'CASH',
      'UPI',
      'CARD',
      'CREDIT',
    ];

    let refundPaymentAmount = 0;
    let creditRefundAmount = 0;

    const refundPayments =
      dto.payments.map(
        (payment) => {
          const paymentMode =
            payment.paymentMode.toUpperCase();

          if (
            !allowedRefundModes.includes(
              paymentMode,
            )
          ) {
            throw new BadRequestException(
              `Invalid refund payment mode: ${payment.paymentMode}`,
            );
          }

          if (
            !Number.isFinite(
              payment.amount,
            ) ||
            payment.amount <= 0
          ) {
            throw new BadRequestException(
              'Refund payment amount must be greater than zero.',
            );
          }

          const cardSurcharge =
            Number(
              payment.cardSurcharge ?? 0,
            );

          if (
            !Number.isFinite(
              cardSurcharge,
            ) ||
            cardSurcharge < 0
          ) {
            throw new BadRequestException(
              'Card surcharge cannot be negative.',
            );
          }

          if (
            cardSurcharge > 0 &&
            paymentMode !== 'CARD'
          ) {
            throw new BadRequestException(
              'Card surcharge is allowed only for CARD refunds.',
            );
          }

          refundPaymentAmount +=
            Number(payment.amount);

          if (
            paymentMode === 'CREDIT'
          ) {
            creditRefundAmount +=
              Number(payment.amount);
          }

          return {
            paymentMode,
            amount: Number(
              payment.amount,
            ),
            cardSurcharge,
            transactionNo:
              payment.transactionNo,
            remarks:
              payment.remarks,
          };
        },
      );

    return this.prisma.$transaction(
      async (prisma) => {
        const returnNo =
          await this.documentNumberService.nextInTransaction(
            DocumentType.SALES_RETURN,
            prisma,
          );

        const salesBill =
          await prisma.salesBill.findUnique({
            where: {
              id: dto.salesBillId,
            },
            include: {
              items: true,
            },
          });

        if (!salesBill) {
          throw new NotFoundException(
            'Original sales bill not found.',
          );
        }

        if (
          salesBill.warehouseId !==
          dto.warehouseId
        ) {
          throw new BadRequestException(
            'Return warehouse must match the original sales bill warehouse.',
          );
        }

        if (
          dto.customerId &&
          dto.customerId !==
            salesBill.customerId
        ) {
          throw new BadRequestException(
            'Return customer does not match the original sales bill customer.',
          );
        }

        /*
         * =====================================================
         * PREVIOUS RETURNS
         * =====================================================
         */

        const previousReturns =
          await prisma.saleReturnItem.findMany({
            where: {
              saleReturn: {
                salesBillId:
                  dto.salesBillId,
              },
            },
          });

        const returnedQtyMap =
          new Map<string, number>();

        for (
          const returnedItem of previousReturns
        ) {
          const key =
            returnedItem.itemId +
            ':' +
            returnedItem.batchId;

          returnedQtyMap.set(
            key,
            (returnedQtyMap.get(key) ?? 0) +
              Number(returnedItem.qty),
          );
        }

        /*
         * =====================================================
         * DUPLICATE REQUEST LINES
         * =====================================================
         */

        const requestKeys =
          new Set<string>();

        for (const item of dto.items) {
          const key =
            item.itemId +
            ':' +
            item.batchId;

          if (requestKeys.has(key)) {
            throw new BadRequestException(
              'Duplicate item/batch combination in return.',
            );
          }

          requestKeys.add(key);
        }

        /*
         * =====================================================
         * CALCULATIONS
         * =====================================================
         */

        let grossAmount = 0;
        let taxableAmount = 0;
        let totalCgst = 0;
        let totalSgst = 0;
        let totalIgst = 0;
        let netAmount = 0;

        const validatedItems: Array<{
          itemId: string;
          batchId: string;
          qty: number;
          saleRate: number;
          gstPercent: number;
          taxableAmount: number;
          cgstAmount: number;
          sgstAmount: number;
          igstAmount: number;
          netAmount: number;
        }> = [];

        /*
         * =====================================================
         * VALIDATE RETURN ITEMS
         * =====================================================
         */

        for (const item of dto.items) {
          const salesItem =
            salesBill.items.find(
              (line) =>
                line.itemId ===
                  item.itemId &&
                line.batchId ===
                  item.batchId,
            );

          if (!salesItem) {
            throw new BadRequestException(
              'Item/batch was not sold on the original sales bill.',
            );
          }

          const originalQty =
            Number(salesItem.qty);

          const key =
            item.itemId +
            ':' +
            item.batchId;

          const alreadyReturned =
            returnedQtyMap.get(key) ?? 0;

          const remainingQty =
            originalQty -
            alreadyReturned;

          if (
            item.qty <= 0
          ) {
            throw new BadRequestException(
              'Return quantity must be greater than zero.',
            );
          }

          if (
            item.qty >
            remainingQty
          ) {
            throw new BadRequestException(
              `Cannot return ${item.qty}. Remaining returnable quantity: ${remainingQty}.`,
            );
          }

          /*
           * Original sale values are authoritative.
           */

          const originalRate =
            Number(
              salesItem.saleRate,
            );

          const originalGst =
            Number(
              salesItem.gstPercent,
            );

          if (
            Math.abs(
              item.saleRate -
                originalRate,
            ) > 0.000001
          ) {
            throw new BadRequestException(
              `Sale rate must match the original sale rate: ${originalRate}.`,
            );
          }

          if (
            Math.abs(
              item.gstPercent -
                originalGst,
            ) > 0.000001
          ) {
            throw new BadRequestException(
              `GST must match the original GST: ${originalGst}%.`,
            );
          }

          /*
           * ===================================================
           * TAX CALCULATION
           * ===================================================
           */

          const gross =
            item.qty *
            originalRate;

          const tax =
            gross *
            originalGst /
            100;

          const cgst =
            tax / 2;

          const sgst =
            tax / 2;

          const igst = 0;

          const lineNet =
            gross + tax;

          grossAmount += gross;
          taxableAmount += gross;

          totalCgst += cgst;
          totalSgst += sgst;
          totalIgst += igst;

          netAmount += lineNet;

          validatedItems.push({
            itemId:
              item.itemId,

            batchId:
              item.batchId,

            qty:
              item.qty,

            saleRate:
              originalRate,

            gstPercent:
              originalGst,

            taxableAmount:
              gross,

            cgstAmount:
              cgst,

            sgstAmount:
              sgst,

            igstAmount:
              igst,

            netAmount:
              lineNet,
          });
        }

        /*
         * =====================================================
         * REFUND PAYMENT TOTAL VALIDATION
         * =====================================================
         */

        const roundedNetAmount =
          Number(
            netAmount.toFixed(2),
          );

        const roundedRefundAmount =
          Number(
            refundPaymentAmount.toFixed(2),
          );

        if (
          Math.abs(
            roundedRefundAmount -
              roundedNetAmount,
          ) > 0.01
        ) {
          throw new BadRequestException(
            `Refund payment total mismatch. Return: ${roundedNetAmount.toFixed(
              2,
            )}, Refund payments: ${roundedRefundAmount.toFixed(
              2,
            )}`,
          );
        }

        /*
         * =====================================================
         * CREDIT REFUND VALIDATION
         * =====================================================
         */

        const returnCustomerId =
          dto.customerId ??
          salesBill.customerId;

        if (
          creditRefundAmount > 0 &&
          !returnCustomerId
        ) {
          throw new BadRequestException(
            'Customer is required when using CREDIT refund.',
          );
        }

        /*
         * =====================================================
         * CREATE RETURN HEADER
         * =====================================================
         */

        const saleReturn =
          await prisma.saleReturn.create({
            data: {
              returnNo:
                returnNo,

              returnDate:
                new Date(
                  dto.returnDate,
                ),

              salesBillId:
                dto.salesBillId,

              customerId:
                returnCustomerId,

              warehouseId:
                dto.warehouseId,

              grossAmount,

              taxableAmount,

              cgstAmount:
                totalCgst,

              sgstAmount:
                totalSgst,

              igstAmount:
                totalIgst,

              netAmount,
            },
          });

        /*
         * =====================================================
         * CREATE RETURN ITEMS
         * + RESTORE STOCK
         * + STOCK LEDGER
         * =====================================================
         */

        for (
          const item of validatedItems
        ) {
          await prisma.saleReturnItem.create({
            data: {
              saleReturnId:
                saleReturn.id,

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              qty:
                item.qty,

              saleRate:
                item.saleRate,

              gstPercent:
                item.gstPercent,

              taxableAmount:
                item.taxableAmount,

              cgstAmount:
                item.cgstAmount,

              sgstAmount:
                item.sgstAmount,

              igstAmount:
                item.igstAmount,

              netAmount:
                item.netAmount,
            },
          });

          /*
           * Restore physical stock.
           */

          await prisma.warehouseStock.upsert({
            where: {
              warehouseId_itemId_batchId: {
                warehouseId:
                  dto.warehouseId,

                itemId:
                  item.itemId,

                batchId:
                  item.batchId,
              },
            },

            create: {
              warehouseId:
                dto.warehouseId,

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              quantity:
                item.qty,
            },

            update: {
              quantity: {
                increment:
                  item.qty,
              },
            },
          });

          /*
           * Stock movement history.
           */

          await prisma.stockLedger.create({
            data: {
              transactionDate:
                new Date(),

              transactionType:
                'SALE_RETURN',

              itemId:
                item.itemId,

              batchId:
                item.batchId,

              warehouseId:
                dto.warehouseId,

              qtyIn:
                item.qty,

              qtyOut:
                0,

              referenceType:
                'SALE_RETURN',

              referenceId:
                saleReturn.id,

              remarks:
                'Sale Return - Stock Restored',
            },
          });
        }

        /*
         * =====================================================
         * CREATE REFUND PAYMENT RECORDS
         * =====================================================
         */

        for (
          const payment of refundPayments
        ) {
          await prisma.saleReturnPayment.create({
            data: {
              saleReturnId:
                saleReturn.id,

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

        /*
         * =====================================================
         * CUSTOMER LEDGER
         *
         * ONLY THE CREDIT REFUND PORTION reduces
         * customer outstanding.
         *
         * CASH / UPI / CARD refunds do NOT affect
         * customer outstanding.
         * =====================================================
         */

        if (
          creditRefundAmount > 0 &&
          returnCustomerId
        ) {
          await this.ledgerService.postSalesReturn(
            returnCustomerId,
            creditRefundAmount,
            saleReturn.id,
            prisma,
          );
        }

        /*
         * =====================================================
         * RETURN COMPLETE
         * =====================================================
         */

        return prisma.saleReturn.findUnique({
          where: {
            id: saleReturn.id,
          },

          include: {
            customer: true,

            warehouse: true,

            salesBill: true,

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

  /*
   * =====================================================
   * FIND ALL
   * =====================================================
   */

  async findAll() {
    return this.prisma.saleReturn.findMany({
      include: {
        customer: true,

        warehouse: true,

        salesBill: true,

        items: {
          include: {
            item: true,
            batch: true,
          },
        },

        payments: true,
      },

      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  /*
   * =====================================================
   * FIND ONE
   * =====================================================
   */

  async findOne(
    id: string,
  ) {
    const saleReturn =
      await this.prisma.saleReturn.findUnique({
        where: {
          id,
        },

        include: {
          customer: true,

          warehouse: true,

          salesBill: true,

          items: {
            include: {
              item: true,
              batch: true,
            },
          },

          payments: true,
        },
      });

    if (!saleReturn) {
      throw new NotFoundException(
        'Sale return not found.',
      );
    }

    return saleReturn;
  }
}
