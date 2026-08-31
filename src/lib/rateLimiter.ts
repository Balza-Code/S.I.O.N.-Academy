import { logger } from './logger';
import getRedis, { redisAvailable } from './redis';

type Counter = { count: number; expiresAt: number };

const inMemoryCounters = new Map<string, Counter>();
const idempotencyStore = new Map<string, number>();

function now() { return Date.now(); }

async function checkRateLimitInMemory(key: string, limit: number, windowMs: number): Promise<boolean> {
  const entry = inMemoryCounters.get(key);
  const expiresAt = now() + windowMs;
  if (!entry || entry.expiresAt < now()) {
    inMemoryCounters.set(key, { count: 1, expiresAt });
    return true;
  }
  if (entry.count >= limit) {
    return false;
  }
  entry.count += 1;
  return true;
}

export async function checkRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  if (redisAvailable) {
    try {
      const redis = await getRedis();
      if (redis) {
        const seconds = Math.ceil(windowMs / 1000);
        const count = await redis.incr(key);
        if (count === 1) {
          try { await redis.expire(key, seconds); } catch (e) {}
        }
        return count <= limit;
      }
    } catch (e) {
      logger.warn({ err: (e as any)?.message }, 'redis_rate_limit_error');
    }
  }
  return checkRateLimitInMemory(key, limit, windowMs);
}

export async function consumeRateLimit(key: string, limit: number, windowMs: number): Promise<boolean> {
  const ok = await checkRateLimit(key, limit, windowMs);
  if (!ok) {
    logger.warn({ key, limit, windowMs }, 'rate_limit_exceeded');
  }
  return ok;
}

async function checkIdempotencyInMemory(userId: number | string, idempotencyKey?: string): Promise<boolean> {
  if (!idempotencyKey) return true;
  const storeKey = `${userId}:${idempotencyKey}`;
  if (idempotencyStore.has(storeKey)) return false;
  idempotencyStore.set(storeKey, Date.now());
  return true;
}

export async function checkIdempotency(userId: number | string, idempotencyKey?: string): Promise<boolean> {
  if (!idempotencyKey) return true;
  const storeKey = `${userId}:${idempotencyKey}`;
  if (redisAvailable) {
    try {
      const redis = await getRedis();
      if (redis) {
        // NX with TTL 24h
        const res = await redis.set(storeKey, '1', { ex: 60 * 60 * 24, nx: true });
        return res !== null;
      }
    } catch (e) {
      logger.warn({ err: (e as any)?.message }, 'redis_idempotency_error');
    }
  }
  return checkIdempotencyInMemory(userId, idempotencyKey);
}

// Simple cleanup task for memory stores (best-effort)
setInterval(() => {
  const t = now();
  for (const [k, v] of inMemoryCounters) {
    if (v.expiresAt < t) inMemoryCounters.delete(k);
  }
  for (const [k, ts] of idempotencyStore) {
    if (ts + 1000 * 60 * 60 * 24 < t) idempotencyStore.delete(k); // 24h
  }
}, 1000 * 60 * 5);
