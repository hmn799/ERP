import { CreateSalesItemDto } from './create-sales-item.dto';

export class CreateSalesDto {
  billNo: string;

  billDate: Date;

  customerId?: string;

  warehouseId: string;

  salesmanId?: string;

  isCredit?: boolean;

  billDiscountPercent?: number;

  items: CreateSalesItemDto[];
}