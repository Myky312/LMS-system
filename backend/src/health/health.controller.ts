import { Controller, Get } from '@nestjs/common';
import { db } from '../database/drizzle';
import { sql } from 'drizzle-orm';

/**
 * Health endpoints for orchestration (Kubernetes, Docker, load balancers).
 * - GET /api/v1/health       → liveness:  no DB check, fast (is the process up?)
 * - GET /api/v1/health/ready → readiness: DB check (can the app serve traffic?)
 */
@Controller('health')
export class HealthController {
  @Get()
  liveness() {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('ready')
  async readiness() {
    await db.execute(sql`SELECT 1`);
    return {
      status: 'ready',
    };
  }
}
