import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';

describe('Authentication Flow (e2e)', () => {
  let app: INestApplication;
  let authToken: string;
  let userId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    
    // Apply the same validation pipe as in main.ts
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe('Health Check', () => {
    it('/health (GET) should return health status', () => {
      return request(app.getHttpServer())
        .get('/health')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('status', 'ok');
          expect(res.body).toHaveProperty('service', 'AI Chat Platform API');
        });
    });
  });

  describe('User Registration', () => {
    it('/auth/signup (POST) should create a new user', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'testuser',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
          expect(res.body.user).toHaveProperty('username', 'testuser');
          authToken = res.body.access_token;
          userId = res.body.user.id;
        });
    });

    it('/auth/signup (POST) should reject duplicate email', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'test@example.com',
          password: 'password123',
          username: 'anotheruser',
        })
        .expect(409);
    });
  });

  describe('User Login', () => {
    it('/auth/login (POST) should login existing user', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'password123',
        })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('access_token');
          expect(res.body.user).toHaveProperty('email', 'test@example.com');
        });
    });

    it('/auth/login (POST) should reject invalid credentials', () => {
      return request(app.getHttpServer())
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'wrongpassword',
        })
        .expect(401);
    });
  });

  describe('Protected Routes', () => {
    it('/user/profile (GET) should require authentication', () => {
      return request(app.getHttpServer())
        .get('/user/profile')
        .expect(401);
    });

    it('/user/profile (GET) should return user profile when authenticated', () => {
      return request(app.getHttpServer())
        .get('/user/profile')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('email', 'test@example.com');
          expect(res.body).toHaveProperty('username', 'testuser');
        });
    });
  });

  describe('Chat Creation', () => {
    it('/chat/create (POST) should create a new chat', () => {
      return request(app.getHttpServer())
        .post('/chat/create')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Chat',
          firstMessage: 'Hello, this is a test message!',
        })
        .expect(201)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Test Chat');
          expect(res.body.messages).toHaveLength(1);
          expect(res.body.messages[0]).toHaveProperty('content', 'Hello, this is a test message!');
        });
    });

    it('/chat/history (GET) should return user chats', () => {
      return request(app.getHttpServer())
        .get('/chat/history')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(200)
        .expect((res) => {
          expect(Array.isArray(res.body)).toBe(true);
          expect(res.body.length).toBeGreaterThan(0);
        });
    });
  });

  describe('Input Validation', () => {
    it('should reject invalid email format', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'invalid-email',
          password: 'password123',
        })
        .expect(400);
    });

    it('should reject short password', () => {
      return request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: 'valid@example.com',
          password: '123',
        })
        .expect(400);
    });
  });
});
