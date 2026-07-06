import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchaseGstService {
  calculateItem(
    qty: number,
    purchaseRate: number,
    discountPercent: number,
    gstPercent: number,
  ) {
    const grossAmount = qty * purchaseRate;

    const discountAmount =
      grossAmount * (discountPercent || 0) / 100;

    const taxableAmount =
      grossAmount - discountAmount;

    const gstAmount =
      taxableAmount * gstPercent / 100;

    const cgstAmount =
      gstAmount / 2;

    const sgstAmount =
      gstAmount / 2;

    const igstAmount = 0;

    const netAmount =
      taxableAmount + gstAmount;

    return {
      grossAmount,
      discountAmount,
      taxableAmount,
      cgstAmount,
      sgstAmount,
      igstAmount,
      netAmount,
    };
  }

  calculateBill(
    grossAmount: number,
    billDiscountPercent: number,
    totalCgst: number,
    totalSgst: number,
    totalIgst: number,
  ) {
    const discountAmount =
      grossAmount * (billDiscountPercent || 0) / 100;

    const taxableAmount =
      grossAmount - discountAmount;

    const netAmount =
      taxableAmount +
      totalCgst +
      totalSgst +
      totalIgst;

    return {
      discountAmount,
      taxableAmount,
      netAmount,
    };
  }
}