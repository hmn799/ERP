import { Module } from '@nestjs/common';

import { PrismaModule } from '../../modules/prisma/prisma.module';

import { PricingEngineService } from './pricing-engine.service';

@Module({
  imports: [
    PrismaModule,
  ],

  providers: [
    PricingEngineService,
  ],

  exports: [
    PricingEngineService,
  ],
})
export class PricingEngineModule {}