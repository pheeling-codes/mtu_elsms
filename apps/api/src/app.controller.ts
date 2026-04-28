import { Controller, Get } from '@nestjs/common';

@Controller('health')
export class AppController {
  @Get()
  getHealth(): { status: string; database: string } {
    return {
      status: 'ok',
      database: 'connected',
    };
  }
}
