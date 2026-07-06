import { CreatePurchaseOrderItemDto } from './create-purchase-order-item.dto';

export class CreatePurchaseOrderDto {
  supplierId: string;

  warehouseId: string;

  orderDate: string;

  expectedDate?: string;

  remarks?: string;

  items: CreatePurchaseOrderItemDto[];
}