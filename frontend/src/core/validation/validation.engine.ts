import { TransactionRow } from "../types/transaction.types";

export interface ValidationMessage {
  severity:
    | "info"
    | "warning"
    | "error";

  message: string;
}

export class ValidationEngine {
  validatePurchase(
    row: TransactionRow,
  ): ValidationMessage[] {
    const messages: ValidationMessage[] =
      [];

    if (row.qty <= 0) {
      messages.push({
        severity: "error",
        message:
          "Quantity should be greater than zero.",
      });
    }

    if (row.totalValue <= 0) {
      messages.push({
        severity: "warning",
        message:
          "Total value is zero.",
      });
    }

    return messages;
  }
}

export const validationEngine =
  new ValidationEngine();