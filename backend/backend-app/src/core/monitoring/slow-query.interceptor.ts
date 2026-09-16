import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';

import { MonitoringService } from '../../modules/monitoring/monitoring.service';

@Injectable()
export class SlowQueryInterceptor implements NestInterceptor {
  constructor(
    private readonly monitoringService: MonitoringService,
  ) {}

  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();

    return next.handle().pipe(
      tap(() => {
        const durationMs = Date.now() - start;
        const threshold = Number(
          process.env.SLOW_QUERY_THRESHOLD_MS || 3000,
        );

        if (durationMs > threshold) {
          this.monitoringService
            .recordAlert(
              'SLOW_QUERY',
              'WARNING',
              `${request.method} ${request.originalUrl || request.url} took ${durationMs}ms (threshold ${threshold}ms).`,
              {
                method: request.method,
                url: request.originalUrl || request.url,
                durationMs,
                thresholdMs: threshold,
              },
              'slow-query-interceptor',
            )
            .catch(() => undefined);
        }
      }),
    );
  }
}
