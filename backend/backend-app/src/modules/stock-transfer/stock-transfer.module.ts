import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { DocumentNumberModule } from "../../core/document-number/document-number.module";

import { StockTransferController } from "./stock-transfer.controller";
import { StockTransferService } from "./stock-transfer.service";

@Module({
  imports: [PrismaModule, DocumentNumberModule],
  controllers: [StockTransferController],
  providers: [StockTransferService],
  exports: [StockTransferService],
})
export class StockTransferModule {}
