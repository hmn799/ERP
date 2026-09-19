import { IsDateString, IsString } from "class-validator";

export class CreateFinancialYearDto {
  @IsString()
  name: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;
}
