import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

const LOCALHOST_VARIANTS = new Set([
  '::1',
  '127.0.0.1',
  '::ffff:127.0.0.1',
  '',
]);

/**
 * Throttler guard with stable IP tracking for rate limiting.
 * Normalizes req.ip (localhost can be ::1, 127.0.0.1, or undefined) into a
 * single tracker so the global limit accumulates. Falls back to
 * x-forwarded-for when behind a proxy.
 */
@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  protected getTracker(req: Record<string, unknown>): Promise<string> {
    const headers = req.headers as
      | Record<string, string | string[] | undefined>
      | undefined;
    const forwarded = headers?.['x-forwarded-for'];
    const raw =
      req.ip ??
      (typeof forwarded === 'string'
        ? forwarded.split(',')[0]?.trim()
        : Array.isArray(forwarded)
          ? forwarded[0]
          : undefined) ??
      '';
    const str = typeof raw === 'string' ? raw : '';
    const ip = LOCALHOST_VARIANTS.has(str) || !str ? 'localhost' : str;
    return Promise.resolve(ip);
  }
}
