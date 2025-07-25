import { Global, Module } from '@nestjs/common';

import { KyselyService } from './kysely.service';

@Global()
@Module({
  exports: [KyselyService],
  providers: [KyselyService],
})
export class KyselyModule {}
