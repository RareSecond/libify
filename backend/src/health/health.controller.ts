import { InjectQueue } from '@nestjs/bullmq';
import { Controller, Get } from '@nestjs/common';
import { Queue } from 'bullmq';

import { DatabaseService } from '../database/database.service';

@Controller('health')
export class HealthController {
  constructor(
    private database: DatabaseService,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}

  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('services')
  async checkAllServices() {
    const [database, redis] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      services: {
        api: 'ok',
        database:
          database.status === 'fulfilled'
            ? database.value
            : { error: database.reason, status: 'error' },
        redis:
          redis.status === 'fulfilled'
            ? redis.value
            : { error: redis.reason, status: 'error' },
      },
      status:
        database.status === 'fulfilled' &&
        database.value.status === 'ok' &&
        redis.status === 'fulfilled' &&
        redis.value.status === 'ok'
          ? 'ok'
          : 'error',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('database')
  async checkDatabase() {
    try {
      await this.database.$queryRaw`SELECT 1`;
      return {
        database: 'connected',
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        database: 'disconnected',
        error: error.message,
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }

  @Get('redis')
  async checkRedis() {
    try {
      const client = await this.syncQueue.client;
      await client.ping();
      return {
        redis: 'connected',
        status: 'ok',
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return {
        error: error.message,
        redis: 'disconnected',
        status: 'error',
        timestamp: new Date().toISOString(),
      };
    }
  }
}
