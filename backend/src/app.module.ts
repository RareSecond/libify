import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';

import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DatabaseModule } from './database/database.module';

@Module({
  controllers: [AppController],
  imports: [ConfigModule.forRoot({ isGlobal: true }), DatabaseModule],
  providers: [AppService],
})
export class AppModule {}
