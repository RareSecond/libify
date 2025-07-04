import { Injectable } from '@nestjs/common';

import { DatabaseService } from './database/database.service';

@Injectable()
export class AppService {
  constructor(private databaseService: DatabaseService) {}

  async getHello(): Promise<string> {
    const userCount = await this.databaseService.user.count();
    return `Hello World! There are ${userCount} users in the database.`;
  }
}
