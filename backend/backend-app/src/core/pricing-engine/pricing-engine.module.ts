import { Module } from '@nestjs/common';

import { PrismaModule } from '../../modules/prisma/prisma.module';

import { PricingEngineService } from './pricing-engine.service';
import { PricingEngineController } from './pricing-engine.controller';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    PricingEngineController,
  ],

  providers: [
    PricingEngineService,
  ],

  exports: [
    PricingEngineService,
  ],
})
export class PricingEngineModule {}