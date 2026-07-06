import { CreateSaleReturnItemDto } from './create-sale-return-item.dto';

export class CreateSaleReturnDto {
  returnNo: string;

  returnDate: Date;

  salesBillId: string;

  customerId?: string;

  warehouseId: string;

  items: CreateSaleReturnItemDto[];
}