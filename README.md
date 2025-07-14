# NestJS AI Server for AWS Lambda

<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

A production-ready NestJS application that provides AI chat functionality using Google's Gemini API, deployed on AWS Lambda.

## Features

- 🤖 **Google Gemini AI Integration** - Advanced AI chat capabilities
- � **JWT Authentication** - Secure user authentication system
- ⚡ **AWS Lambda Optimized** - Serverless deployment ready
- 💾 **MongoDB Integration** - Persistent data storage
- 🛡️ **Rate Limiting** - Protection against excessive API usage
- 📊 **Admin Dashboard** - System monitoring and user management
- � **Comprehensive Error Handling** - Detailed error responses
- 🌐 **RESTful API** - Clean and consistent endpoints

## Tech Stack

- **Framework**: NestJS (TypeScript)
- **Database**: MongoDB with Mongoose
- **AI Service**: Google Gemini API
- **Serverless**: AWS Lambda with Express adapter
- **Authentication**: JWT
- **Validation**: class-validator, class-transformer

## Quick Start

### Prerequisites

- Node.js (v20 or higher)
- MongoDB database (Atlas recommended)
- Google Gemini API key
- AWS account with Lambda access

### Quick Setup

1. Clone the repository:
```bash
git clone <repository-url>
cd nest-ai-server
```

2. Install dependencies:
```bash
npm install
```

## Deployment to AWS Lambda

We've created a suite of scripts to simplify the deployment process:

```powershell
# Opens an interactive maintenance menu
.\maintain-lambda.ps1

# Or run specific actions directly:
.\maintain-lambda.ps1 -Action build    # Build deployment package
.\maintain-lambda.ps1 -Action deploy   # Show deployment instructions
.\maintain-lambda.ps1 -Action test     # Test Lambda URL
.\maintain-lambda.ps1 -Action cleanup  # Clean up project files
```

### Deployment Steps

1. Build the deployment package with `.\fix-lambda-handler-package.ps1`
2. Upload the generated `lambda-fixed-handler-package.zip` to AWS Lambda
3. Set the handler to `index.handler`
4. Configure environment variables (see below)
5. Test the deployment with `.\test-lambda-url.ps1`

### Configuration

Required environment variables:

```
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/dbname
JWT_SECRET=your_jwt_secret_key
GEMINI_API_KEY=your_gemini_api_key
```

Optional configuration:

```
PORT=3000                  # For local development
NODE_ENV=production        # Set to production for Lambda
RATE_LIMIT_MAX=100        # Maximum requests per window
RATE_LIMIT_WINDOW=60000   # Time window in ms (60 seconds)
```

### AWS Lambda Configuration

- **Handler**: `index.handler`
- **Runtime**: Node.js 20.x
- **Memory**: 512 MB minimum (1024 MB recommended)
- **Timeout**: 30 seconds
- **Environment Variables**: See above

### Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run tests
npm test
```

## API Documentation

The API provides RESTful endpoints for authentication, chat functionality, and admin operations. 
Comprehensive API documentation is available in the included Postman collection.

### Key Endpoints

### Health Check
```bash
GET /health
```

### Authentication

```bash
# User Registration
POST /auth/register

# Login
POST /auth/login

# Get user profile
GET /auth/profile
```

### Chat

```bash
# Get AI chat response
POST /chat/completion

# Get chat history
GET /chat/history

# Create new chat
POST /chat/create
```

### User APIs

#### Get Current User Info
```bash
GET /user/me
Authorization: Bearer <jwt-token>
```

#### Get User Profile
```bash
GET /user/profile
Authorization: Bearer <jwt-token>
```

#### Update User Profile
```bash
PUT /user/profile
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "name": "John Doe",
  "email": "newemail@example.com"
}
```

#### Change Password
```bash
POST /user/change-password
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "currentPassword": "oldPassword123",
  "newPassword": "newPassword123"
}
```

### Chat APIs

#### Create New Chat
```bash
POST /chat/create
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "message": "Hello, I need help with something"
}
```

#### Send Message to Existing Chat
```bash
POST /chat/message
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "chatId": "60d5ecb74b24d1a1c8e4b123",
  "message": "What's the weather like today?",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant", 
      "content": "Previous response"
    }
  ]
}
```

#### Get Chat History
```bash
GET /chat/history?page=1&limit=10
Authorization: Bearer <jwt-token>
```

#### Get Specific Chat
```bash
GET /chat/:chatId
Authorization: Bearer <jwt-token>
```

#### Delete Chat
```bash
DELETE /chat/:chatId
Authorization: Bearer <jwt-token>
```

#### Stream Chat Response (SSE)
```bash
GET /chat/stream?chatId=60d5ecb74b24d1a1c8e4b123&message=Hello
Authorization: Bearer <jwt-token>
Accept: text/event-stream
```

### Chatroom APIs

#### Create Chatroom
```bash
POST /chatroom
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "title": "My AI Assistant",
  "description": "Personal AI helper chatroom"
}
```

#### Get User's Chatrooms
```bash
GET /chatroom
Authorization: Bearer <jwt-token>
```

#### Get Specific Chatroom
```bash
GET /chatroom/:id
Authorization: Bearer <jwt-token>
```

#### Send Message to Chatroom (Async Processing)
```bash
POST /chatroom/:id/message
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "message": "Hello, how are you today?",
  "history": [
    {
      "role": "user",
      "content": "Previous message"
    },
    {
      "role": "assistant",
      "content": "Previous response"
    }
  ]
}

# Response:
{
  "message": "Message queued for processing.",
  "jobId": "12345"
}
```

#### Get Message Processing Status
```bash
GET /chatroom/job/:jobId/status
Authorization: Bearer <jwt-token>

# Response:
{
  "status": "completed",
  "data": {
    "response": "AI generated response here"
  }
}
```

### Subscription APIs

#### Subscribe to Pro Plan
```bash
POST /subscribe/pro
Authorization: Bearer <jwt-token>
Content-Type: application/json

{
  "paymentMethodId": "pm_1234567890"
}
```

#### Handle Stripe Webhook
```bash
POST /webhook/stripe
Content-Type: application/json
Stripe-Signature: <stripe-signature>

{
  // Stripe webhook payload
}
```

#### Get Subscription Status
```bash
GET /subscription/status
Authorization: Bearer <jwt-token>
```

### Admin APIs

#### Get System Stats
```bash
GET /admin/stats
Authorization: Bearer <admin-jwt-token>
```

#### Get User Stats
```bash
GET /admin/users/:userId/stats
Authorization: Bearer <admin-jwt-token>
```

## Testing

### Unit Tests
```bash
npm run test
```

### End-to-End Tests
```bash
npm run test:e2e
```

### Test Coverage
```bash
npm run test:cov
```

### Manual API Testing

Use the provided Postman collection (`postman-collection.json`) or test manually:

```bash
# Health check
curl http://localhost:3000/health

# Register user
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "mobileNumber": "+1234567890", 
    "password": "test123",
    "name": "Test User"
  }'

# Send OTP
curl -X POST http://localhost:3000/auth/send-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890"}'

# Verify OTP
curl -X POST http://localhost:3000/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"mobileNumber": "+1234567890", "otp": "123456"}'

# Create chatroom
curl -X POST http://localhost:3000/chatroom \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"title": "Test Chat", "description": "Test chatroom"}'

# Send message to chatroom (async)
curl -X POST http://localhost:3000/chatroom/60d5ecb74b24d1a1c8e4b123/message \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <jwt-token>" \
  -d '{"message": "Hello AI!"}'
```

## Architecture

### System Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client App    │───▶│   NestJS API    │───▶│   MongoDB       │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐    ┌─────────────────┐
                       │   Redis Queue   │───▶│  Gemini API     │
                       └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │   Stripe API    │
                       └─────────────────┘
```

### Key Components

#### Authentication Module
- OTP-based mobile verification
- JWT token management
- Password encryption with bcrypt
- Public route decorators

#### Chatroom Module
- User-specific conversation management
- Message storage and retrieval
- AI response integration
- Rate limiting enforcement

#### Queue System
- Asynchronous message processing
- Redis Bull Queue implementation
- Graceful fallback to synchronous processing
- Error handling and retries

#### Subscription Module
- Stripe integration for payments
- Webhook handling for status updates
- Tier-based feature access
- Usage tracking and limits

### Rate Limiting

- **Basic Tier**: 5 messages per day
- **Pro Tier**: Unlimited messages
- **Admin**: Unlimited access
- Automatic reset at midnight UTC

### Error Handling

- Global exception filter
- Structured error responses
- Logging with request correlation
- Graceful service degradation

## Configuration

### Environment Variables

| Variable | Description | Required | Default |
|----------|-------------|----------|---------|
| `MONGO_URI` | MongoDB connection string | Yes | - |
| `JWT_SECRET` | JWT signing secret | Yes | - |
| `GEMINI_API_KEY` | Google Gemini API key | Yes | - |
| `REDIS_HOST` | Redis server host | No | localhost |
| `REDIS_PORT` | Redis server port | No | 6379 |
| `STRIPE_SECRET_KEY` | Stripe secret key | Yes* | - |
| `STRIPE_WEBHOOK_SECRET` | Stripe webhook secret | Yes* | - |
| `PORT` | Application port | No | 3000 |
| `NODE_ENV` | Environment mode | No | development |

*Required for subscription features

### Database Schema

#### User Schema
```typescript
{
  email: string (unique)
  mobileNumber: string (unique)
  password: string (hashed)
  name?: string
  subscriptionTier: 'basic' | 'pro' | 'admin'
  subscriptionStatus: 'active' | 'inactive' | 'cancelled'
  dailyMessageCount: number
  lastMessageDate: Date
  stripeCustomerId?: string
  stripeSubscriptionId?: string
  isVerified: boolean
  otp?: string
  otpExpiry?: Date
  createdAt: Date
  updatedAt: Date
}
```

#### Chat Schema
```typescript
{
  userId: ObjectId
  title: string
  messages: [{
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }]
  createdAt: Date
  updatedAt: Date
}
```

#### Chatroom Schema
```typescript
{
  userId: ObjectId
  title: string
  description?: string
  messages: [{
    id: string
    role: 'user' | 'assistant'
    content: string
    timestamp: Date
  }]
  lastActivity: Date
  createdAt: Date
  updatedAt: Date
}
```

## Deployment

### Docker Deployment

1. Build the Docker image:
```bash
docker build -t ai-chat-platform .
```

2. Run with Docker Compose:
```bash
docker-compose up -d
```

### Production Deployment

1. Set production environment variables
2. Build the application:
```bash
npm run build
```

3. Start the production server:
```bash
npm run start:prod
```

### Environment-Specific Configurations

#### Development
- Hot reloading enabled
- Detailed error messages
- Debug logging

#### Production
- Optimized builds
- Error logging only
- Security headers
- Rate limiting enforced

## Monitoring

### Health Checks
- Database connectivity
- Redis connectivity
- External API status

### Metrics
- API response times
- Message processing rates
- Error rates by endpoint
- User activity tracking

### Logging
- Request/response logging
- Error tracking
- Performance metrics
- Security events

## Security

### Authentication
- JWT token-based authentication
- OTP verification for mobile numbers
- Password hashing with bcrypt
- Session management

### API Security
- Rate limiting per user/IP
- CORS configuration
- Input validation
- SQL injection prevention
- XSS protection

### Data Protection
- Encrypted sensitive data
- Secure password storage
- PII data handling
- GDPR compliance ready

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-feature`
3. Commit changes: `git commit -am 'Add new feature'`
4. Push to branch: `git push origin feature/new-feature`
5. Submit a pull request

### Development Guidelines

- Follow TypeScript best practices
- Write unit tests for new features
- Update documentation
- Use conventional commit messages
- Ensure code coverage above 80%

## Troubleshooting

### Common Issues

#### MongoDB Connection Failed
```bash
# Check MongoDB service
docker-compose ps mongodb

# View MongoDB logs
docker-compose logs mongodb
```

#### Redis Connection Failed
```bash
# Check Redis service
docker-compose ps redis

# View Redis logs
docker-compose logs redis
```

#### Gemini API Errors
- Verify API key in environment variables
- Check API quotas and limits
- Ensure proper request formatting

#### Stripe Webhook Issues
- Verify webhook secret
- Check endpoint URL configuration
- Test with Stripe CLI for local development

### Debug Mode

Enable debug logging:
```bash
NODE_ENV=development DEBUG=* npm run start:dev
```

### Performance Optimization

- Enable Redis caching
- Implement database indexing
- Use connection pooling
- Monitor memory usage
- Optimize Gemini API calls

## License

This project is [MIT licensed](LICENSE).

## Support

For support and questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation

---

Built with ❤️ using NestJS and Google Gemini AI
