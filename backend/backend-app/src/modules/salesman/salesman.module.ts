import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { SalesmanController } from './salesman.controller';
import { SalesmanService } from './salesman.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    SalesmanController,
  ],

  providers: [
    SalesmanService,
  ],
})
export class SalesmanModule {}