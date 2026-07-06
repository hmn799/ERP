import { CreatePurchaseReturnItemDto } from './create-purchase-return-item.dto';

export class CreatePurchaseReturnDto {
  returnNo: string;

  returnDate: Date;

  purchaseBillId: string;

  supplierId: string;

  warehouseId: string;

  items: CreatePurchaseReturnItemDto[];
}