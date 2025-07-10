import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
  private store: RateLimitStore = {};
  private readonly maxRequests = 100; // Max requests per window
  private readonly windowMs = 15 * 60 * 1000; // 15 minutes

  use(req: Request, res: Response, next: NextFunction) {
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const now = Date.now();
    
    // Clean up expired entries
    Object.keys(this.store).forEach(key => {
      if (this.store[key].resetTime < now) {
        delete this.store[key];
      }
    });

    // Initialize or get current rate limit data
    if (!this.store[ip]) {
      this.store[ip] = {
        count: 1,
        resetTime: now + this.windowMs,
      };
    } else {
      this.store[ip].count++;
    }

    const current = this.store[ip];

    // Set rate limit headers
    res.set({
      'X-RateLimit-Limit': this.maxRequests.toString(),
      'X-RateLimit-Remaining': Math.max(0, this.maxRequests - current.count).toString(),
      'X-RateLimit-Reset': new Date(current.resetTime).toISOString(),
    });

    // Check if rate limit exceeded
    if (current.count > this.maxRequests) {
      res.status(429).json({
        error: 'Rate limit exceeded',
        message: `Too many requests. Limit is ${this.maxRequests} requests per ${this.windowMs / 1000 / 60} minutes.`,
        retryAfter: Math.ceil((current.resetTime - now) / 1000),
      });
      return;
    }

    next();
  }
}
