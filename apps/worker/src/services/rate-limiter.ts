import { redis } from '../redis/client.js';

// Lua token-bucket — atomic, single round-trip.
// Returns 1 if a token was consumed, 0 if rate-limited.
const ACQUIRE_SCRIPT = `
local key    = KEYS[1]
local limit  = tonumber(ARGV[1])
local window = tonumber(ARGV[2])
local now    = tonumber(ARGV[3])

redis.call('ZREMRANGEBYSCORE', key, '-inf', now - window)
local count = redis.call('ZCARD', key)

if count < limit then
  redis.call('ZADD', key, now, now .. '-' .. math.random(1e9))
  redis.call('EXPIRE', key, math.ceil(window / 1000) + 5)
  return 1
end
return 0
`;

const WINDOW_MS = 60_000; // 1-minute sliding window

export async function acquireToken(
  workspaceId: string,
  limitPerMinute: number,
): Promise<boolean> {
  const key = `tb:${workspaceId}`;
  const now = Date.now();
  const result = await redis.eval(ACQUIRE_SCRIPT, [key], [limitPerMinute, WINDOW_MS, now]);
  return result === 1;
}
