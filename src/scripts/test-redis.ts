import Redis from 'ioredis';
import { databaseConfig } from '../config/configuration';

async function testRedisConnection() {
  const config = databaseConfig();
  
  console.log('Testing Redis connection...');
  console.log('Host:', config.redis.host);
  console.log('Port:', config.redis.port);
  
  const redis = new Redis({
    host: config.redis.host,
    port: config.redis.port,
    password: config.redis.password,
    connectTimeout: 10000,
    lazyConnect: true,
    enableReadyCheck: false,
    maxRetriesPerRequest: null,
  });

  try {
    await redis.connect();
    console.log('✅ Redis connected successfully!');
    
    // Test basic operations
    await redis.set('test-key', 'test-value', 'EX', 60);
    const value = await redis.get('test-key');
    console.log('✅ Redis set/get test:', value === 'test-value' ? 'PASSED' : 'FAILED');
    
    // Test queue-like operations
    await redis.lpush('test-queue', 'message1', 'message2');
    const queueLength = await redis.llen('test-queue');
    console.log('✅ Redis queue test:', queueLength >= 2 ? 'PASSED' : 'FAILED');
    
    // Cleanup
    await redis.del('test-key', 'test-queue');
    
    await redis.disconnect();
    console.log('✅ Redis test completed successfully!');
    
  } catch (error) {
    console.error('❌ Redis connection failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  testRedisConnection();
}

export { testRedisConnection };
