import { IsNotEmpty, IsString, MaxLength } from "class-validator";

export class UpdateSubCategoryDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  name: string;

  @IsString()
  @IsNotEmpty()
  categoryId: string;
}