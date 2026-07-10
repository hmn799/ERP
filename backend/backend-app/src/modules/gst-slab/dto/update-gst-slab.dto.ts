import {
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from "class-validator";

export class UpdateGstSlabDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsNumber()
  @Min(0)
  @Max(100)
  percentage: number;
}