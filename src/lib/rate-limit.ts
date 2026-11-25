interface RateBucket {
  timestamps: number[];
}

const MAX_TRACKED_KEYS = 1000;
const buckets = new Map<string, RateBucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSec: number;
}

function pruneExpiredBuckets(cutoff: number): void {
  for (const [k, v] of buckets.entries()) {
    const active = v.timestamps.filter((ts) => ts > cutoff);
    if (active.length === 0) {
      buckets.delete(k);
    } else {
      v.timestamps = active;
    }
  }
  if (buckets.size > MAX_TRACKED_KEYS) {
    const oldestKey = buckets.keys().next().value;
    if (oldestKey) buckets.delete(oldestKey);
  }
}

export function checkRateLimit(
  key: string,
  maxRequests = 15,
  windowMs = 60_000
): RateLimitResult {
  const now = Date.now();
  const cutoff = now - windowMs;

  if (buckets.size >= MAX_TRACKED_KEYS) {
    pruneExpiredBuckets(cutoff);
  }

  const existing = buckets.get(key) ?? { timestamps: [] };
  const active = existing.timestamps.filter((ts) => ts > cutoff);

  if (active.length >= maxRequests) {
    const oldest = active[0] ?? now;
    const retryAfterSec = Math.max(
      1,
      Math.ceil((oldest + windowMs - now) / 1000)
    );
    buckets.set(key, { timestamps: active });
    return {
      allowed: false,
      remaining: 0,
      retryAfterSec,
    };
  }

  active.push(now);
  buckets.set(key, { timestamps: active });
  return {
    allowed: true,
    remaining: Math.max(0, maxRequests - active.length),
    retryAfterSec: 0,
  };
}

export function resetRateLimiterForTests(): void {
  buckets.clear();
}
