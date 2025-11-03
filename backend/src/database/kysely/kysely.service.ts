import { Injectable, OnModuleDestroy } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Kysely } from "kysely";

import { createKyselyDatabase } from "./database";
import { DB } from "./types";

@Injectable()
export class KyselyService implements OnModuleDestroy {
  get database(): Kysely<DB> {
    return this.db;
  }

  private readonly db: Kysely<DB>;

  constructor(private configService: ConfigService) {
    const databaseUrl = this.configService.get<string>("DATABASE_URL");
    if (!databaseUrl) {
      throw new Error("DATABASE_URL is not configured");
    }

    this.db = createKyselyDatabase(databaseUrl);
  }

  async onModuleDestroy() {
    await this.db.destroy();
  }
}
