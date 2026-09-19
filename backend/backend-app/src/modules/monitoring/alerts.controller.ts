import {
  Controller,
  Get,
  Param,
  Post,
  UseGuards,
} from '@nestjs/common';

import { MonitoringService } from './monitoring.service';

import { OptionalJwtAuthGuard } from '../auth/guards/optional-jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import type { AuthUser } from '../auth/types/auth-user.type';

/*
 * Business alerts (low stock, over-credit-limit customers,
 * expiring schemes) for the in-app notification bell - deliberately
 * a separate, unguarded controller from MonitoringController, whose
 * whole class requires VIEW_MONITORING (an admin permission meant
 * for technical/system alerts). Everyday staff need to see these.
 */
@Controller('alerts')
export class AlertsController {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}

  @Get()
  list() {
    return this.monitoringService.listBusinessAlerts();
  }

  @Post('generate')
  generate() {
    return this.monitoringService.generateBusinessAlerts();
  }

  @Post(':id/acknowledge')
  @UseGuards(OptionalJwtAuthGuard)
  acknowledge(
    @Param('id') id: string,
    @CurrentUser() user?: AuthUser,
  ) {
    return this.monitoringService.acknowledgeBusinessAlert(
      id,
      user
        ? { id: user.sub, name: user.fullName || user.username }
        : undefined,
    );
  }
}
