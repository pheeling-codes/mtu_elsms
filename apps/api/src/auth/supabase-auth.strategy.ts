import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { createClient } from '@supabase/supabase-js';

export interface SupabaseAuthUser {
  userId: string;
  email: string;
  role: string;
  matricNumber?: string;
}

@Injectable()
export class SupabaseAuthStrategy extends PassportStrategy(Strategy, 'supabase') {
  private supabase;

  constructor(private configService: ConfigService) {
    const jwtSecret = configService.get<string>('SUPABASE_JWT_SECRET');
    if (!jwtSecret) {
      throw new Error('SUPABASE_JWT_SECRET is not defined');
    }
    
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: jwtSecret,
      ignoreExpiration: false,
    });

    this.supabase = createClient(
      configService.get('SUPABASE_URL')!,
      configService.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );
  }

  async validate(payload: any): Promise<SupabaseAuthUser> {
    try {
      // Verify the JWT token with Supabase
      const { data: { user }, error } = await this.supabase.auth.getUser(
        payload.token,
      );

      if (error || !user) {
        throw new UnauthorizedException('Invalid token');
      }

      // Get user role from user metadata
      const role = user.user_metadata?.role || 'STUDENT';
      const matricNumber = user.user_metadata?.matricNumber;

      return {
        userId: user.id,
        email: user.email!,
        role,
        matricNumber,
      };
    } catch (error) {
      throw new UnauthorizedException('Invalid token');
    }
  }
}
