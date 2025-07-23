import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService implements OnModuleInit {
  private readonly algorithm = 'aes-256-gcm';
  private encryptionKey: Buffer;
  private readonly ivLength = 16;
  private readonly logger = new Logger(EncryptionService.name);
  private readonly pbkdf2Iterations = 100000;
  private readonly pbkdf2KeyLength = 32;
  private readonly saltLength = 64;
  private readonly tagLength = 16;

  constructor(private configService: ConfigService) {}

  decrypt(encryptedText: string): string {
    if (!encryptedText) return encryptedText;

    try {
      const combined = Buffer.from(encryptedText, 'base64');

      const salt = combined.subarray(0, this.saltLength);
      const iv = combined.subarray(
        this.saltLength,
        this.saltLength + this.ivLength,
      );
      const tag = combined.subarray(
        this.saltLength + this.ivLength,
        this.saltLength + this.ivLength + this.tagLength,
      );
      const encrypted = combined.subarray(
        this.saltLength + this.ivLength + this.tagLength,
      );

      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        this.pbkdf2Iterations,
        this.pbkdf2KeyLength,
        'sha256',
      );

      const decipher = crypto.createDecipheriv(this.algorithm, key, iv);
      decipher.setAuthTag(tag);

      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);

      return decrypted.toString('utf8');
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Failed to decrypt data');
    }
  }

  decryptObject<T>(encryptedText: string): T {
    return JSON.parse(this.decrypt(encryptedText));
  }

  encrypt(text: string): string {
    if (!text) return text;

    try {
      const salt = crypto.randomBytes(this.saltLength);
      const key = crypto.pbkdf2Sync(
        this.encryptionKey,
        salt,
        this.pbkdf2Iterations,
        this.pbkdf2KeyLength,
        'sha256',
      );

      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipheriv(this.algorithm, key, iv);

      const encrypted = Buffer.concat([
        cipher.update(text, 'utf8'),
        cipher.final(),
      ]);

      const tag = cipher.getAuthTag();

      const combined = Buffer.concat([salt, iv, tag, encrypted]);

      return combined.toString('base64');
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Failed to encrypt data');
    }
  }

  encryptObject<T>(obj: T): string {
    return this.encrypt(JSON.stringify(obj));
  }

  onModuleInit() {
    const key = this.configService.get<string>('ENCRYPTION_KEY');
    this.encryptionKey = Buffer.from(key, 'hex');
    this.logger.log('Encryption service initialized');
  }
}
