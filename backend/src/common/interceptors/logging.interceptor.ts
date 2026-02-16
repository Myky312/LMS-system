import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';
import { Observable, tap } from 'rxjs';
import type { Request, Response } from 'express';

interface RequestWithId extends Request {
  requestId?: string;
}

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly logger: PinoLogger) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<RequestWithId>();
    const requestId = req.requestId;
    const start = Date.now();

    return next.handle().pipe(
      tap(() => {
        const res = context.switchToHttp().getResponse<Response>();
        const durationMs = Date.now() - start;
        this.logger.info({
          requestId,
          method: req.method,
          path: req.url ?? req.originalUrl,
          statusCode: res.statusCode,
          durationMs,
        });
      }),
    );
  }
}
