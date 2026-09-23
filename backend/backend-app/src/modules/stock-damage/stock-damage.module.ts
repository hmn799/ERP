import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { DocumentNumberModule } from '../../core/document-number/document-number.module';

import { StockDamageController } from './stock-damage.controller';
import { StockDamageService } from './stock-damage.service';

@Module({
  imports: [
    PrismaModule,
    DocumentNumberModule,
  ],

  controllers: [
    StockDamageController,
  ],

  providers: [
    StockDamageService,
  ],

  exports: [
    StockDamageService,
  ],
})
export class StockDamageModule {}
