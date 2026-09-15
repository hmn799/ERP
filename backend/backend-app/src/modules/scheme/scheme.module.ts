import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { SchemeController } from './scheme.controller';
import { SchemeService } from './scheme.service';
import { SchemeEngineService } from './scheme-engine.service';

@Module({
  imports: [PrismaModule],

  controllers: [SchemeController],

  providers: [SchemeService, SchemeEngineService],

  exports: [SchemeEngineService],
})
export class SchemeModule {}
