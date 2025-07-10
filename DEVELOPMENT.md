# 🚀 AI Chat Platform - Development Guide

## 🏁 Quick Start Guide

### Prerequisites
- **Node.js** (v18 or higher)
- **MongoDB** (local installation or Docker)
- **Groq API Key** (sign up at [Groq Console](https://console.groq.com/))

### Step 1: Environment Setup

1. **Clone and Install**
   ```bash
   git clone <repository-url>
   cd hello-nest
   npm install
   ```

2. **Environment Configuration**
   
   Create `.env` file in root directory:
   ```env
   # Database
   MONGODB_URI=mongodb://localhost:27017/ai-chat-platform
   
   # JWT Security
   JWT_SECRET=your-super-secret-jwt-key-change-in-production
   JWT_EXPIRES_IN=7d
   
   # Groq AI API
   GROQ_API_KEY=your-groq-api-key-here
   
   # Server
   PORT=3000
   NODE_ENV=development
   
   # CORS
   FRONTEND_URL=http://localhost:3001
   ```

3. **Get Groq API Key**
   - Visit [Groq Console](https://console.groq.com/)
   - Create account and get API key
   - Add to your `.env` file

### Step 2: Database Setup

**Option A: Local MongoDB**
```bash
# Install MongoDB locally
# Windows: Download from MongoDB official website
# macOS: brew install mongodb-community
# Ubuntu: sudo apt-get install mongodb

# Start MongoDB
mongod
```

**Option B: Docker MongoDB**
```bash
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=password123 \
  mongo:7.0
```

### Step 3: Run the Application

```bash
# Development mode (recommended)
npm run start:dev

# Production mode
npm run start:prod
```

### Step 4: Seed Sample Data (Optional)

```bash
# Add sample users and chats
npm run db:seed

# Clear all data
npm run db:clear
```

Sample login credentials after seeding:
- **Email**: `demo@example.com` **Password**: `password123`
- **Email**: `test@example.com` **Password**: `password123`
- **Email**: `admin@example.com` **Password**: `admin123`

## 🧪 Testing the API

### Method 1: Using Postman
1. Import `postman-collection.json` into Postman
2. Set `baseUrl` variable to `http://localhost:3000`
3. Run the collection requests in order

### Method 2: Using cURL

**1. Health Check**
```bash
curl http://localhost:3000/health
```

**2. Register User**
```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123",
    "username": "myusername"
  }'
```

**3. Login User**
```bash
curl -X POST http://localhost:3000/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

**4. Send Chat Message** (replace TOKEN)
```bash
curl -X POST http://localhost:3000/chat/message \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Hello, tell me about machine learning!"
  }'
```

**5. Stream Chat Response** (Server-Sent Events)
```bash
curl -N -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Accept: text/event-stream" \
  "http://localhost:3000/chat/stream?message=What is AI?"
```

### Method 3: Frontend Testing

Create a simple HTML file to test streaming:

```html
<!DOCTYPE html>
<html>
<head>
    <title>AI Chat Test</title>
</head>
<body>
    <div id="response"></div>
    <script>
        const token = 'YOUR_JWT_TOKEN'; // Replace with actual token
        const eventSource = new EventSource(
            `http://localhost:3000/chat/stream?message=Hello AI!`,
            {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            }
        );

        eventSource.onmessage = function(event) {
            const data = JSON.parse(event.data);
            if (data.type === 'content') {
                document.getElementById('response').innerHTML += data.data.chunk;
            }
        };
    </script>
</body>
</html>
```

## 🏗️ Project Architecture

### Module Structure
```
src/
├── auth/           # Authentication & Authorization
├── user/           # User management
├── chat/           # Chat functionality
├── groq/           # Groq AI integration
├── admin/          # Admin endpoints & statistics
├── database/       # Database utilities & seeders
├── common/         # Shared utilities
│   ├── middleware/ # Custom middleware
│   ├── interceptors/ # Custom interceptors
│   ├── filters/    # Exception filters
│   └── services/   # Shared services
├── schemas/        # MongoDB schemas
└── config/         # Configuration
```

### Key Features Implemented

✅ **Authentication System**
- JWT-based authentication
- User registration and login
- Protected routes with guards
- Password hashing with bcrypt

✅ **Chat System**
- Real-time streaming with Server-Sent Events
- Chat history persistence
- Multiple conversation support
- Groq AI integration

✅ **Database Integration**
- MongoDB with Mongoose ODM
- User and Chat schemas
- Database seeding utilities

✅ **Production Features**
- Request logging interceptor
- Rate limiting middleware
- Global exception handling
- Input validation with DTOs
- Environment configuration
- Docker support

✅ **Admin Features**
- API usage statistics
- User analytics
- Chat metrics

## 🔧 Development Commands

```bash
# Development
npm run start:dev      # Start in development mode
npm run start:debug    # Start with debug mode

# Building
npm run build          # Build for production
npm run start:prod     # Start production build

# Testing
npm run test          # Unit tests
npm run test:e2e      # End-to-end tests
npm run test:cov      # Test coverage

# Database
npm run db:seed       # Seed sample data
npm run db:clear      # Clear all data

# Code Quality
npm run lint          # ESLint
npm run format        # Prettier formatting
```

## 🐳 Docker Deployment

### Development with Docker Compose
```bash
# Start all services (MongoDB + API)
docker-compose up -d

# View logs
docker-compose logs -f api

# Stop all services
docker-compose down
```

### Production Docker Build
```bash
# Build production image
docker build -t ai-chat-api .

# Run production container
docker run -d \
  -p 3000:3000 \
  -e MONGODB_URI=your-mongodb-uri \
  -e GROQ_API_KEY=your-groq-key \
  ai-chat-api
```

## 🔍 Monitoring & Debugging

### Application Logs
The application includes comprehensive logging:
- Request/Response logging
- Error tracking
- Performance metrics

### Health Check
Monitor application health:
```bash
curl http://localhost:3000/health
```

### MongoDB Admin UI
When using Docker Compose, access MongoDB Express at:
- URL: `http://localhost:8081`
- Username: `admin`
- Password: `admin123`

### API Statistics
Get API usage statistics:
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:3000/admin/stats
```

## 🚀 Next Steps

### Frontend Integration
This backend is designed to work with a Next.js frontend. Key integration points:

1. **Authentication**: JWT tokens for user sessions
2. **Real-time Chat**: Server-Sent Events for streaming
3. **API Endpoints**: RESTful API for all operations
4. **CORS**: Configured for frontend domain

### Deployment Options
- **Railway**: Easy deployment with MongoDB Atlas
- **Heroku**: With MongoDB Atlas addon
- **DigitalOcean**: App Platform or Droplets
- **AWS**: ECS or Elastic Beanstalk
- **Vercel**: For serverless deployment

### Scaling Considerations
- Add Redis for session storage
- Implement database connection pooling
- Add horizontal scaling with load balancers
- Consider microservices architecture

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📞 Support

For questions or issues:
1. Check the logs: `docker-compose logs api`
2. Verify environment variables in `.env`
3. Ensure MongoDB is running
4. Check Groq API key validity

---

**Happy Coding!** 🎉 This backend showcases modern NestJS development practices and is ready for production use with proper environment configuration.
