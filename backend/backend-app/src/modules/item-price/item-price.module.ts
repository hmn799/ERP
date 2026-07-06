import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { ItemPriceController } from './item-price.controller';
import { ItemPriceService } from './item-price.service';

import { PriceHistoryService } from './services/price-history.service';

@Module({
  imports: [
    PrismaModule,
  ],
  controllers: [
    ItemPriceController,
  ],
  providers: [
    ItemPriceService,
    PriceHistoryService,
  ],
  exports: [
    ItemPriceService,
    PriceHistoryService,
  ],
})
export class ItemPriceModule {}