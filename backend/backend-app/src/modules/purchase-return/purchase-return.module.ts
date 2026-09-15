import { Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";
import { LedgerModule } from "../ledger/ledger.module";
import { DocumentNumberModule } from "../../core/document-number/document-number.module";

import { PurchaseReturnController } from "./purchase-return.controller";
import { PurchaseReturnService } from "./purchase-return.service";

@Module({
  imports: [
    PrismaModule,
    LedgerModule,
    DocumentNumberModule,
  ],

  controllers: [
    PurchaseReturnController,
  ],

  providers: [
    PurchaseReturnService,
  ],

  exports: [
    PurchaseReturnService,
  ],
})
export class PurchaseReturnModule {}