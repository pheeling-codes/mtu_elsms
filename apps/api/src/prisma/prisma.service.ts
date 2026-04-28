import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@elsms/database';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name);

  async onModuleInit() {
    try {
      await this.$connect();
      this.logger.log('✅ Connected to database');
    } catch (error) {
      console.error('❌ Failed to connect to Supabase Cloud DB', error);
    }
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
