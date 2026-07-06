import { Module } from '@nestjs/common';

import { PrismaModule } from '../../modules/prisma/prisma.module';

import { FifoEngineService } from './fifo-engine.service';

@Module({
  imports: [
    PrismaModule,
  ],

  providers: [
    FifoEngineService,
  ],

  exports: [
    FifoEngineService,
  ],
})
export class FifoEngineModule {}