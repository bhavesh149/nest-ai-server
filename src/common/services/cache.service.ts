import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  async reset(): Promise<void> {
    // Reset functionality - delete all keys (implementation depends on cache store)
    try {
      await (this.cacheManager as any).reset();
    } catch (error) {
      console.warn('Cache reset not supported by current cache manager');
    }
  }

  // Generate cache key for user chatrooms
  getUserChatroomsKey(userId: string): string {
    return `user_chatrooms:${userId}`;
  }

  // Generate cache key for chatroom details
  getChatroomKey(chatroomId: string): string {
    return `chatroom:${chatroomId}`;
  }

  // Generate cache key for AI response (based on conversation context)
  getAIResponseKey(messages: any[]): string {
    const contextHash = this.hashMessages(messages);
    return `ai_response:${contextHash}`;
  }

  private hashMessages(messages: any[]): string {
    // Simple hash function for caching similar conversations
    const content = messages.map(m => `${m.role}:${m.content}`).join('|');
    return Buffer.from(content).toString('base64').slice(0, 32);
  }
}
