export class CreatePurchaseItemDto {
  itemId: string;

  batchNo: string;

  qty: number;

  purchaseRate: number;

  retailRate: number;

  wholesaleRate: number;

  distributorRate: number;

  mrp: number;

  expiryDate?: Date;

  barcode?: string;

  discountPercent: number;

  gstPercent: number;
}