import { Controller, Get } from '@nestjs/common';
import { db } from '../database/drizzle';
import { sql } from 'drizzle-orm';

@Controller('health')
export class HealthController {
  @Get()
  health() {
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
