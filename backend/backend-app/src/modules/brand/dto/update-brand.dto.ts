import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateBrandDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;
}