/**
 * Durable Object-based rate limiter for globally consistent counting.
 * Unlike Cache API (which is per-POP), Durable Objects provide strongly
 * consistent storage with a single global instance per key.
 *
 * Each rate limit "bucket" is a DO instance named by IP + route type.
 * The DO stores a sliding window counter in transactional storage.
 */

export class RateLimiterDurableObject {
  state: DurableObjectState;

  constructor(state: DurableObjectState, _env: unknown) {
    this.state = state;
  }

  /**
   * Handle rate limit check request.
   * Body: { limit, windowSec }
   * Returns: { allowed, remaining, resetAt }
   */
  async fetch(request: Request): Promise<Response> {
    const body = await request.json<{ limit: number; windowSec: number }>();
    const { limit, windowSec } = body;
    const now = Math.floor(Date.now() / 1000);

    // Get current window data from transactional storage
    const windowKey = `w:${Math.floor(now / windowSec)}`;
    const stored = (await this.state.storage.get<number>(windowKey)) ?? 0;
    const count = stored + 1;

    // Store incremented count
    await this.state.storage.put(windowKey, count);

    // Set alarm to clean up expired windows (avoid storage bloat)
    const resetAt = (Math.floor(now / windowSec) + 1) * windowSec;
    if ((await this.state.storage.getAlarm()) === null) {
      await this.state.storage.setAlarm(resetAt * 1000);
    }

    const allowed = count <= limit;
    const remaining = Math.max(0, limit - count);

    return new Response(
      JSON.stringify({ allowed, remaining, resetAt }),
      { headers: { 'Content-Type': 'application/json' } },
    );
  }

  /**
   * Alarm handler — clean up expired window entries to prevent storage bloat.
   */
  async alarm(): Promise<void> {
    const now = Math.floor(Date.now() / 1000);
    // Delete all entries older than 1 hour
    const entries = await this.state.storage.list<number>();
    for (const [key, _value] of entries) {
      if (key.startsWith('w:')) {
        const windowNum = parseInt(key.substring(2), 10);
        // Keep last 2 windows, delete older
        const currentWindow = Math.floor(now / 60);
        if (windowNum < currentWindow - 2) {
          await this.state.storage.delete(key);
        }
      }
    }
  }
}
