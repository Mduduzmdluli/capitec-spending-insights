import { sessionSchema } from '../api/schemas';
import type { Session } from '../api/schemas';

/**
 * sessionStorage is cleared when the tab closes, unlike localStorage, which lasts until
 * deleted. A real bank would go further and keep the token in a Secure, HttpOnly cookie
 * that JavaScript can't read at all; only a real server can set one of those.
 */
const STORAGE_KEY = 'spending-insights:session';

export function loadStoredSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    // Never trust stored data blindly: anything malformed is ignored
    const result = sessionSchema.safeParse(JSON.parse(raw));
    return result.success ? result.data : null;
  } catch {
    return null;
  }
}

export function storeSession(session: Session) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    // Storage unavailable: the session lasts until the page is refreshed
  }
}

export function clearStoredSession() {
  try {
    sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear
  }
}
