import { Controller, Get } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../database/prisma.service';

@Controller('health')
export class HealthController {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('sync') private syncQueue: Queue,
  ) {}

  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  @Get('database')
  async checkDatabase() {
    try {
      await this.prisma.$queryRaw`SELECT 1`;
      return { 
        status: 'ok', 
        database: 'connected',
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { 
        status: 'error', 
        database: 'disconnected', 
        error: error.message,
        timestamp: new Date().toISOString() 
      };
    }
  }

  @Get('redis')
  async checkRedis() {
    try {
      const client = await this.syncQueue.client;
      await client.ping();
      return { 
        status: 'ok', 
        redis: 'connected',
        timestamp: new Date().toISOString() 
      };
    } catch (error) {
      return { 
        status: 'error', 
        redis: 'disconnected', 
        error: error.message,
        timestamp: new Date().toISOString() 
      };
    }
  }

  @Get('services')
  async checkAllServices() {
    const [database, redis] = await Promise.allSettled([
      this.checkDatabase(),
      this.checkRedis(),
    ]);

    return {
      status: database.status === 'fulfilled' && database.value.status === 'ok' &&
              redis.status === 'fulfilled' && redis.value.status === 'ok' ? 'ok' : 'error',
      services: {
        api: 'ok',
        database: database.status === 'fulfilled' ? database.value : { status: 'error', error: database.reason },
        redis: redis.status === 'fulfilled' ? redis.value : { status: 'error', error: redis.reason },
      },
      timestamp: new Date().toISOString(),
    };
  }
}
