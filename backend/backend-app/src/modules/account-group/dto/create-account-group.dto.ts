import {
  IsIn,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from "class-validator";

export const ACCOUNT_GROUP_NATURE_TYPES = [
  "ASSET",
  "LIABILITY",
  "INCOME",
  "EXPENSE",
] as const;

export class CreateAccountGroupDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsIn(ACCOUNT_GROUP_NATURE_TYPES)
  natureType: string;

  @IsOptional()
  @IsString()
  description?: string;
}
