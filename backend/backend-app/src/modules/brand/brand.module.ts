import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { BrandController } from './brand.controller';
import { BrandService } from './brand.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    BrandController,
  ],

  providers: [
    BrandService,
  ],
})
export class BrandModule {}