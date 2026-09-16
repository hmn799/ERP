import { IsNotEmpty, IsString } from 'class-validator';

export class ConfirmMatchDto {
  @IsString()
  @IsNotEmpty()
  ledgerEntryId: string;
}
