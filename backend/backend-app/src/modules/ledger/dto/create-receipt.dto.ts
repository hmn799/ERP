export class CreateReceiptDto {
  customerId: string;

  amount: number;

  receiptDate: Date;

  remarks?: string;
}