interface Entry {
  count: number;
  resetTime: number;
}

const store = new Map<string, Entry>();

const WINDOW_MS = 60_000; // 1 minute
const MAX_REQUESTS = 10;

export function checkRateLimit(ip: string): { allowed: boolean } {
  const now = Date.now();

  // Clean expired entries
  for (const [key, entry] of store) {
    if (now > entry.resetTime) store.delete(key);
  }

  const entry = store.get(ip);

  if (!entry) {
    store.set(ip, { count: 1, resetTime: now + WINDOW_MS });
    return { allowed: true };
  }

  if (entry.count >= MAX_REQUESTS) {
    return { allowed: false };
  }

  entry.count += 1;
  return { allowed: true };
}
