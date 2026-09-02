let client: any = undefined;

const url = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;
export const redisAvailable = Boolean(url && token);

export async function getRedis() {
  if (!redisAvailable) return undefined;
  if (client) return client;
  try {
    const mod = await import('@upstash/redis');
    // Works with v2 API: new Redis({ url, token })
    // @ts-ignore
    client = new mod.Redis({ url, token });
    return client;
  } catch (err: unknown) {
    // Not fatal; fall back to in-memory limiter
    // eslint-disable-next-line no-console
    const message = err instanceof Error ? err.message : 'Redis unavailable';
    console.warn('Upstash Redis client not available:', message);
    return undefined;
  }
}

export default getRedis;
