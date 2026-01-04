import { Injectable, Inject } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class CacheService {
  constructor(
    @Inject('REDIS_CLIENT')
    private readonly redis: Redis,
  ) {}

  async get<T>(key: string): Promise<T | null> {
    const value = await this.redis.get(key);
    return value ? (JSON.parse(value) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = 120): Promise<void> {
    await this.redis.set(
      key,
      JSON.stringify(value),
      'EX',
      ttlSeconds,
    );
  }

  async del(key: string): Promise<void> {
    await this.redis.del(key);
  }

  async invalidateUserDebts(userId: string, debtId?: string): Promise<void> {
    await Promise.all([
      this.del(`debts:user:${userId}:all`),
      this.del(`debts:user:${userId}:pending`),
      this.del(`debts:user:${userId}:paid`),
      this.del(`debts:summary:user:${userId}`),
      debtId ? this.del(`debt:${debtId}`) : Promise.resolve(),
    ]);
  }
}
