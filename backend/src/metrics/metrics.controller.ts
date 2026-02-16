import { Controller, Get, Res } from '@nestjs/common';
import type { Response } from 'express';
import { MetricsService } from './metrics.service';

@Controller()
export class MetricsController {
  constructor(private readonly metrics: MetricsService) {}

  @Get('metrics')
  async metricsEndpoint(@Res() res: Response): Promise<void> {
    res.set('Content-Type', 'text/plain; charset=utf-8');
    res.send(await this.metrics.getMetrics());
  }
}
