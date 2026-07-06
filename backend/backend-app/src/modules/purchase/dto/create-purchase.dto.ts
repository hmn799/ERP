import { CreatePurchaseItemDto } from './create-purchase-item.dto';

export class CreatePurchaseDto {
  billNo: string;

  billDate: Date;

  supplierId: string;

  warehouseId: string;

  purchaseOrderId?: string;

  invoiceNo?: string;

  invoiceDate?: Date;

  billDiscountPercent?: number;

  items: CreatePurchaseItemDto[];
}