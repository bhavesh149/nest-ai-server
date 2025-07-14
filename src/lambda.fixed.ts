import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { configure as serverlessExpress } from '@vendia/serverless-express';
// Fix: Import express correctly
import * as express from 'express';

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
    // Fix: Create express app using proper CommonJS import
    const expressApp = express();
    
    const app = await NestFactory.create(
      AppModule,
      new ExpressAdapter(expressApp),
      {
        logger: ['error', 'warn', 'log'], // Reduce logging in Lambda
      },
    );

    // Enable CORS for API Gateway
    app.enableCors({
      origin: true,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
      allowedHeaders: [
        'Content-Type',
        'Authorization',
        'X-Requested-With',
        'Accept',
        'Origin',
        'X-Api-Key',
        'Stripe-Signature'
      ],
    });

    // Global validation pipe
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
        disableErrorMessages: false,
      }),
    );

    // Global exception filter
    app.useGlobalFilters(new AllExceptionsFilter());
    
    // Global interceptor
    app.useGlobalInterceptors(new LoggingInterceptor());

    await app.init();
    
    // Create serverless handler
    cachedServer = serverlessExpress({ app: expressApp });
  }
  
  return cachedServer;
}

// Lambda handler
export const handler = async (event: APIGatewayProxyEvent, context: Context): Promise<APIGatewayProxyResult> => {
  // Log the event for debugging
  console.log('Lambda handler invoked with event:', JSON.stringify(event, null, 2));
  
  // For health checks from API Gateway
  if (event.path === '/health' && event.httpMethod === 'GET') {
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }),
    };
  }
  
  // Initialize server and process event
  const server = await bootstrapServer();
  return server(event, context);
};
