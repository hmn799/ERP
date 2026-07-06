export class CreatePaymentDto {
  supplierId: string;

  amount: number;

  paymentDate: Date;

  remarks?: string;
}