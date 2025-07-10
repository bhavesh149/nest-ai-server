import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AppService } from './app.service';
import { Public } from './auth/decorators/public.decorator';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Public()
  @Get('health')
  getHealth(): { status: string; timestamp: string; service: string } {
    return {
      status: 'ok',
      timestamp: new Date().toISOString(),
      service: 'AI Chat Platform API',
    };
  }

  @Public()
  @Get('favicon.ico')
  @HttpCode(HttpStatus.NO_CONTENT)
  getFavicon(): void {
    // Return 204 No Content to handle favicon requests gracefully
    // This prevents the 404 error that browsers generate when requesting favicon.ico
  }
}
