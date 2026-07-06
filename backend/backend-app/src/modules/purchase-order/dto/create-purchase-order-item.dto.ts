export class CreatePurchaseOrderItemDto {
  itemId: string;

  qtyOrdered: number;

  purchaseRate: number;

  discountPercent: number;

  gstPercent: number;
}