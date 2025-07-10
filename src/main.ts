import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { ConfigService } from '@nestjs/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  const configService = app.get(ConfigService);
  
  // Enable CORS
  app.enableCors({
    origin: configService.get('app.frontendUrl') || 'http://localhost:3000',
    credentials: true,
  });
  
  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      disableErrorMessages: false,
      validationError: {
        target: false,
        value: false,
      },
    }),
  );
  
  const port = configService.get('app.port') || 3001;
  await app.listen(port);
  
  console.log(`🚀 AI Chat Platform API is running on: http://localhost:${port}`);
  console.log(`📖 Ready to accept requests from: ${configService.get('app.frontendUrl')}`);
}
bootstrap();
