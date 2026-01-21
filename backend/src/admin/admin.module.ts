import { Module } from "@nestjs/common";

import { AuthModule } from "../auth/auth.module";
import { LibraryModule } from "../library/library.module";
import { AdminController } from "./admin.controller";

@Module({
  controllers: [AdminController],
  imports: [AuthModule, LibraryModule],
})
export class AdminModule {}
