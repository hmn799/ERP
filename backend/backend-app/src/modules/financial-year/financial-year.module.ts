import { Global, Module } from "@nestjs/common";

import { PrismaModule } from "../prisma/prisma.module";

import { FinancialYearController } from "./financial-year.controller";
import { FinancialYearService } from "./financial-year.service";
import { FinancialYearGuardService } from "./financial-year-guard.service";

/*
 * @Global() so FinancialYearGuardService can be injected into the
 * Sales/Purchase/Ledger save paths without adding this module to
 * each of their imports arrays - keeps the guard wiring to a single
 * constructor parameter + one validation call in each of those
 * already-complex, heavily-tested services.
 */
@Global()
@Module({
  imports: [PrismaModule],
  controllers: [FinancialYearController],
  providers: [FinancialYearService, FinancialYearGuardService],
  exports: [FinancialYearService, FinancialYearGuardService],
})
export class FinancialYearModule {}
