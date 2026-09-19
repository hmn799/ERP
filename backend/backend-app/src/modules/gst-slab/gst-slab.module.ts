import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { GstSlabController } from './gst-slab.controller';
import { GstSlabService } from './gst-slab.service';

@Module({
  imports: [PrismaModule],

  controllers: [GstSlabController],

  providers: [GstSlabService],

  exports: [GstSlabService],
})
export class GstSlabModule {}