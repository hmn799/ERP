export class GetPriceDto {
  itemId: string;

  customerId?: string;

  quantity: number;

  warehouseId?: string;

  billDate?: Date;
}