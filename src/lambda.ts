import { APIGatewayProxyEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { configure as serverlessExpress } from '@vendia/serverless-express';
import * as express from 'express';

let cachedServer: any;

async function bootstrapServer() {
  if (!cachedServer) {
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

// Helper function to transform event to API Gateway format if needed
function normalizeEvent(event: any): APIGatewayProxyEvent {
  // Check if this is already an API Gateway event
  if (event.httpMethod && event.path) {
    return event as APIGatewayProxyEvent;
  }
  
  // If it's an HTTP API event (API Gateway v2)
  if (event.version === '2.0' && event.requestContext?.http) {
    const { http } = event.requestContext;
    return {
      httpMethod: http.method,
      path: http.path,
      headers: event.headers || {},
      multiValueHeaders: {}, // Convert headers if needed
      queryStringParameters: event.queryStringParameters || {},
      multiValueQueryStringParameters: {}, // Convert query params if needed
      pathParameters: event.pathParameters || {},
      stageVariables: event.stageVariables || {},
      requestContext: event.requestContext,
      resource: event.routeKey || '',
      body: event.body || '',
      isBase64Encoded: event.isBase64Encoded || false
    } as any;
  }
  
  // For direct Lambda invocations or other event sources
  // Create a minimal event that won't cause errors
  return {
    httpMethod: 'GET',
    path: '/health',
    headers: {},
    multiValueHeaders: {},
    queryStringParameters: {},
    multiValueQueryStringParameters: {},
    pathParameters: {},
    stageVariables: {},
    requestContext: {} as any,
    resource: '',
    body: null,
    isBase64Encoded: false
  };
}

// Lambda handler
export const handler = async (event: any, context: Context): Promise<APIGatewayProxyResult> => {
  // Log the event for debugging
  console.log('Lambda handler invoked with event:', JSON.stringify(event, null, 2));
  
  try {
    // Normalize the event to ensure it matches API Gateway format
    const normalizedEvent = normalizeEvent(event);
    
    // For health checks from API Gateway
    if (normalizedEvent.path === '/health' && normalizedEvent.httpMethod === 'GET') {
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
    return server(normalizedEvent, context);
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: 'Internal Server Error',
        error: process.env.NODE_ENV === 'production' ? 'An internal server error occurred' : error.message,
      }),
    };
  }
};
