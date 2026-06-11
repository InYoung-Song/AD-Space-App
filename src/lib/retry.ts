/**
 * Await an async operation, retrying a few times with linear backoff before
 * giving up. Used to ride out transient network blips on Supabase writes so a
 * single dropped request doesn't surface to the user as a failure.
 *
 * The callback must *throw* to signal a retryable failure — for Supabase calls,
 * throw when the returned `{ error }` is set.
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  { attempts = 2, baseDelayMs = 400 }: { attempts?: number; baseDelayMs?: number } = {},
): Promise<T> {
  let lastErr: unknown;
  for (let i = 0; i <= attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (i < attempts) await new Promise((resolve) => setTimeout(resolve, baseDelayMs * (i + 1)));
    }
  }
  throw lastErr;
}
