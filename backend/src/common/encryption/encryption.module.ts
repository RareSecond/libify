import { Global, Module } from "@nestjs/common";

import { EncryptionService } from "./encryption.service";

@Global()
@Module({ exports: [EncryptionService], providers: [EncryptionService] })
export class EncryptionModule {}
