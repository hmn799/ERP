export enum PurchaseRateMode {
  INVOICE_BASED = "INVOICE_BASED",
  EFFECTIVE_COST = "EFFECTIVE_COST",
  MANUAL = "MANUAL",
}

export class FormulaEngine {
  calculatePurchaseRate(
    qty: number,
    freeQty: number,
    totalValue: number,
    mode: PurchaseRateMode =
      PurchaseRateMode.INVOICE_BASED,
  ): number {
    if (qty <= 0) return 0;

    switch (mode) {
      case PurchaseRateMode.EFFECTIVE_COST:
        return Number(
          (
            totalValue /
            (qty + freeQty)
          ).toFixed(4),
        );

      case PurchaseRateMode.MANUAL:
        return 0;

      case PurchaseRateMode.INVOICE_BASED:
      default:
        return Number(
          (
            totalValue / qty
          ).toFixed(4),
        );
    }
  }

  calculateStockQty(
    qty: number,
    freeQty: number,
  ) {
    return qty + freeQty;
  }

  calculateTotalValue(
    qty: number,
    purchaseRate: number,
  ) {
    return Number(
      (qty * purchaseRate).toFixed(2),
    );
  }

  calculateDiscountAmount(
    amount: number,
    discountPercent: number,
  ) {
    return Number(
      (
        amount *
        (discountPercent / 100)
      ).toFixed(2),
    );
  }

  calculateTaxableAmount(
    amount: number,
    discountAmount: number,
  ) {
    return Number(
      (
        amount - discountAmount
      ).toFixed(2),
    );
  }

  calculatePercentage(
    amount: number,
    percent: number,
  ) {
    return Number(
      (
        amount *
        (percent / 100)
      ).toFixed(2),
    );
  }

  calculateNetAmount(
    taxable: number,
    cgst: number,
    sgst: number,
    igst: number,
  ) {
    return Number(
      (
        taxable +
        cgst +
        sgst +
        igst
      ).toFixed(2),
    );
  }
}

export const formulaEngine =
  new FormulaEngine();