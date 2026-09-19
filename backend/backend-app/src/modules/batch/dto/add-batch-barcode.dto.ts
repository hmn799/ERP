import { IsNotEmpty, IsString } from "class-validator";

export class AddBatchBarcodeDto {
  @IsString()
  @IsNotEmpty()
  barcode: string;
}
