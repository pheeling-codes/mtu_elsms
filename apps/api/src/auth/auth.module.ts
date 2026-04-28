import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { SupabaseAuthStrategy } from './supabase-auth.strategy';

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'supabase' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        secret: configService.get('SUPABASE_JWT_SECRET'),
        signOptions: {
          expiresIn: '24h',
        },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [SupabaseAuthStrategy],
  exports: [PassportModule, JwtModule],
})
export class AuthModule {}
