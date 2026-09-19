import { Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';
import { SettingsModule } from '../settings/settings.module';
import { PdfModule } from '../../core/pdf/pdf.module';
import { CompanyModule } from '../company/company.module';

import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';

@Module({
  imports: [
    PrismaModule,
    SettingsModule,
    PdfModule,
    CompanyModule,
  ],

  controllers: [
    ReportsController,
  ],

  providers: [
    ReportsService,
  ],
})
export class ReportsModule {}