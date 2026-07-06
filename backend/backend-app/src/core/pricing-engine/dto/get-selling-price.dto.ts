export class GetSellingPriceDto {
  customerId?: string;

  itemId: string;

  quantity: number;

  billDate?: Date;
}