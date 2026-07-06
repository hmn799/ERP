import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { RouteController } from './route.controller';
import { RouteService } from './route.service';

@Module({
  imports: [
    PrismaModule,
  ],

  controllers: [
    RouteController,
  ],

  providers: [
    RouteService,
  ],
})
export class RouteModule {}