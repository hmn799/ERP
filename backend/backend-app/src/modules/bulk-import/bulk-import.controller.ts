import { Body, Controller, Param, Post } from "@nestjs/common";

import { BulkImportService } from "./bulk-import.service";
import { BulkImportDto } from "./dto/bulk-import.dto";

@Controller("bulk-import")
export class BulkImportController {
  constructor(
    private readonly bulkImportService: BulkImportService,
  ) {}

  @Post(":entity")
  import(
    @Param("entity") entity: string,
    @Body() dto: BulkImportDto,
  ) {
    return this.bulkImportService.import(
      entity,
      dto.rows,
    );
  }
}
