import {
  ArgumentsHost,
  Catch,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

import { MonitoringService } from '../../modules/monitoring/monitoring.service';

/*
 * Delegates entirely to Nest's default handling (same response as if
 * this filter did not exist) - its only job is to record an alert
 * for genuine 5xx failures. Expected rejections (400/403/404/409 via
 * HttpException) are not "transaction errors" and are not alerted on.
 */
@Injectable()
@Catch()
export class GlobalExceptionFilter extends BaseExceptionFilter {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {
    super();
  }

  catch(exception: unknown, host: ArgumentsHost) {
    const status =
      exception instanceof HttpException
        ? exception.getStatus()
        : 500;

    if (status >= 500) {
      const request = host.switchToHttp().getRequest();
      const message =
        exception instanceof Error
          ? exception.message
          : 'Unknown error';

      this.monitoringService
        .recordAlert(
          'TRANSACTION_ERROR',
          'CRITICAL',
          message,
          {
            method: request?.method,
            url: request?.originalUrl || request?.url,
          },
          'global-exception-filter',
        )
        .catch(() => undefined);
    }

    super.catch(exception, host);
  }
}
