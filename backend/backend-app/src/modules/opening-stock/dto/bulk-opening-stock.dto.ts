import { Type } from "class-transformer";
import { IsArray } from "class-validator";

export class BulkOpeningStockDto {
  @IsArray()
  @Type(() => Object)
  rows: Record<string, unknown>[];
}
