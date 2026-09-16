import {
  Controller,
  Get,
  Query,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';

import { AnalyticsService } from './analytics.service';

import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { SlowQueryInterceptor } from '../../core/monitoring/slow-query.interceptor';

@Controller('analytics')
@UseGuards(JwtAuthGuard, PermissionsGuard)
@RequirePermissions('VIEW_PROFIT')
@UseInterceptors(SlowQueryInterceptor)
export class AnalyticsController {
  constructor(
    private readonly analyticsService: AnalyticsService,
  ) {}

  @Get('stock-velocity')
  stockVelocity() {
    return this.analyticsService.stockVelocity();
  }

  @Get('reorder-recommendations')
  reorderRecommendations(
    @Query('leadTimeDays') leadTimeDays?: string,
    @Query('coverDays') coverDays?: string,
  ) {
    return this.analyticsService.reorderRecommendations(
      leadTimeDays ? Number(leadTimeDays) : undefined,
      coverDays ? Number(coverDays) : undefined,
    );
  }

  @Get('sales-forecast')
  salesForecast(
    @Query('days') days?: string,
    @Query('historyDays') historyDays?: string,
  ) {
    return this.analyticsService.salesForecast(
      days ? Number(days) : undefined,
      historyDays ? Number(historyDays) : undefined,
    );
  }

  @Get('category-performance')
  categoryPerformance(@Query('days') days?: string) {
    return this.analyticsService.categoryPerformance(
      days ? Number(days) : undefined,
    );
  }

  @Get('trend')
  trendAnalysis(@Query('periodDays') periodDays?: string) {
    return this.analyticsService.trendAnalysis(
      periodDays ? Number(periodDays) : undefined,
    );
  }
}
