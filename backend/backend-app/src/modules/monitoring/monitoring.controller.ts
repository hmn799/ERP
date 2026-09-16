import {
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';

import { MonitoringService } from './monitoring.service';
import { QueryAlertsDto } from './dto/query-alerts.dto';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

@Controller('monitoring')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('VIEW_MONITORING')
export class MonitoringController {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get('alerts')
  listAlerts(@Query() query: QueryAlertsDto) {
    return this.monitoringService.listAlerts(query);
  }

  @Get('summary')
  summary() {
    return this.monitoringService.summary();
  }

  @Post('alerts/:id/acknowledge')
  acknowledge(
    @Param('id') id: string,
    @CurrentUser() user: AuthUser,
  ) {
    return this.monitoringService.acknowledgeAlert(id, {
      id: user.sub,
      name: user.fullName || user.username,
    });
  }

  @Post('reconciliation/run')
  runReconciliation() {
    return this.monitoringService.runReconciliationCheck();
  }
}
