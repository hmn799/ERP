import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ItemController } from './item.controller';
import { ItemService } from './item.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    ItemController,
  ],

  providers: [
    ItemService,
  ],

  exports: [
    ItemService,
  ],
})
export class ItemModule {}