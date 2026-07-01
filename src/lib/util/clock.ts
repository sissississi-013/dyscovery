/**
 * Monotonic-ish wall clock read, isolated behind a function so component code
 * can timestamp interactions (e.g. response latency) without calling the impure
 * `Date.now()` directly in render-adjacent code.
 */
export function nowMs(): number {
  return Date.now();
}
