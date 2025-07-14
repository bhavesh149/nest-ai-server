import { ConfigModule } from '@nestjs/config';

export const configModule = ConfigModule.forRoot({
  isGlobal: true,
  envFilePath: '.env',
});

export const databaseConfig = () => ({
  database: {
    uri: process.env.MONGODB_URI || 'mongodb://localhost:27017/ai-chat-platform',
    name: process.env.DATABASE_NAME || 'ai-chat-platform',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },
  gemini: {
    apiKey: process.env.GEMINI_API_KEY || 'AIzaSyAIy_wx_YKesm9thrWcqRlNnC50L6ww3Hc',
  },
  // Disabled Groq integration
  groq: {
    apiKey: null, // Setting to null to prevent any accidental usage
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD || '',
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || '',
    publishableKey: process.env.STRIPE_PUBLISHABLE_KEY || '',
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
});
