import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
  ],

  controllers: [
    ReportsController,
  ],

  providers: [
    ReportsService,
  ],
})
export class ReportsModule {}