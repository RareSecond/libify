import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';

import { DatabaseModule } from '../database/database.module';
import { HealthController } from './health.controller';

@Module({
  controllers: [HealthController],
  imports: [
    DatabaseModule,
    BullModule.registerQueue({
      name: 'sync',
    }),
  ],
})
export class HealthModule {}
