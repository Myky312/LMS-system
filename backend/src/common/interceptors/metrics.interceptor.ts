import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { MetricsService } from '../../metrics/metrics.service';

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(private readonly metrics: MetricsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<Request>();
    const method: string = req.method;
    // Bounded cardinality only: use route pattern, never raw URL (would create infinite series from IDs).
    const routePath = (req.route as { path?: string } | undefined)?.path;
    const route: string = routePath ?? 'unknown';

    const start = process.hrtime.bigint();

    const record = (status: string) => {
      const durationSeconds =
        Number(process.hrtime.bigint() - start) / 1_000_000_000;
      const labels: { method: string; route: string; status: string } = {
        method,
        route,
        status,
      };
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- MetricsService Counter/Histogram from prom-client
      this.metrics.httpRequestsTotal.inc(labels);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access -- MetricsService Histogram from prom-client
      this.metrics.httpRequestDuration.observe(labels, durationSeconds);
    };

    return next.handle().pipe(
      tap({
        next: () => {
          const res = context.switchToHttp().getResponse<Response>();
          record(String(res.statusCode));
        },
        error: () => {
          record('500');
        },
      }),
    );
  }
}
