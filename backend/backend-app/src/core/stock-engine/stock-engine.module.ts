import { Module } from '@nestjs/common';

import { PrismaModule } from '../../modules/prisma/prisma.module';

import { StockEngineService } from './stock-engine.service';

@Module({
  imports: [
    PrismaModule,
  ],

  providers: [
    StockEngineService,
  ],

  exports: [
    StockEngineService,
  ],
})
export class StockEngineModule {}