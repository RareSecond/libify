import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';

import { HealthController } from './health.controller';
import { DatabaseModule } from '../database/database.module';

@Module({
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'sync',
    }),
  ],
  controllers: [HealthController],
})
export class HealthModule {}
