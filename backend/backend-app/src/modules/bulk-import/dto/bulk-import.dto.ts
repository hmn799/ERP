import { IsArray } from "class-validator";

export class BulkImportDto {
  @IsArray()
  rows: Record<string, string>[];
}
