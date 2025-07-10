import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return '🚀 Welcome to AI Chat Platform API - Your intelligent conversation companion!';
  }
}
