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
  groq: {
    apiKey: process.env.GROQ_API_KEY || '',
  },
  app: {
    port: parseInt(process.env.PORT || '3000', 10),
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3001',
  },
});
