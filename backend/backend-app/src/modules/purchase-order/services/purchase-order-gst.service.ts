import { Injectable } from '@nestjs/common';

@Injectable()
export class PurchaseOrderGstService {
  calculate(
    qty: number,
    purchaseRate: number,
    discountPercent: number,
    gstPercent: number,
  ) {
    const grossAmount = qty * purchaseRate;

    const discountAmount =
      grossAmount * (discountPercent / 100);

    const taxableAmount =
      grossAmount - discountAmount;

    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (gstPercent > 0) {
      cgstAmount =
        taxableAmount * (gstPercent / 2 / 100);

      sgstAmount =
        taxableAmount * (gstPercent / 2 / 100);
    }

    const netAmount =
      taxableAmount +
      cgstAmount +
      sgstAmount +
      igstAmount;

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
}