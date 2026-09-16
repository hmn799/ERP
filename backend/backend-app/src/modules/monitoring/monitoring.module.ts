import { Global, Module } from '@nestjs/common';

import { PrismaModule } from '../prisma/prisma.module';

import { MonitoringController } from './monitoring.controller';
import { MonitoringService } from './monitoring.service';

import { SlowQueryInterceptor } from '../../core/monitoring/slow-query.interceptor';

@Global()
@Module({
  imports: [PrismaModule],
  controllers: [MonitoringController],
  providers: [MonitoringService, SlowQueryInterceptor],
  exports: [MonitoringService, SlowQueryInterceptor],
})
export class MonitoringModule {}
