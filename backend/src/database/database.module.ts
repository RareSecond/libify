import { Module } from '@nestjs/common';

import { DatabaseService } from './database.service';
import { KyselyModule } from './kysely/kysely.module';

@Module({
  exports: [DatabaseService, KyselyModule],
  imports: [KyselyModule],
  providers: [DatabaseService],
})
export class DatabaseModule {}
