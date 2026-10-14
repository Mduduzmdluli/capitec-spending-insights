/**
 * Locks a username after repeated failed sign-ins, to slow down password guessing.
 * Applies to unknown usernames too, so lockouts don't reveal which usernames exist.
 */
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_MS = 5 * 60 * 1000;

type Attempts = { failures: number; lockedUntil: number };

const attempts = new Map<string, Attempts>();

/** Whole minutes until the username unlocks, or 0 if it isn't locked. */
export function lockoutMinutesRemaining(username: string): number {
  const entry = attempts.get(username);
  if (!entry || entry.lockedUntil <= Date.now()) return 0;
  return Math.ceil((entry.lockedUntil - Date.now()) / 60_000);
}

export function recordFailedAttempt(username: string) {
  const entry = attempts.get(username) ?? { failures: 0, lockedUntil: 0 };
  entry.failures += 1;
  if (entry.failures >= MAX_FAILED_ATTEMPTS) {
    entry.failures = 0;
    entry.lockedUntil = Date.now() + LOCKOUT_MS;
  }
  attempts.set(username, entry);
}

export function clearAttempts(username: string) {
  attempts.delete(username);
}

/** For tests. */
export function resetAllAttempts() {
  attempts.clear();
}
