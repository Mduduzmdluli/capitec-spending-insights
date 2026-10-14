/**
 * The mock server's session store. A real backend keeps sessions in its own database.
 * MSW runs inside the page, so its memory is wiped on refresh; keeping sessions in
 * sessionStorage stands in for that database, so a refresh doesn't end every session.
 */
const STORAGE_KEY = 'mock-api:sessions';

/** Sessions end after 15 minutes without any requests. */
export const SESSION_TTL_MS = 15 * 60 * 1000;

type StoredSession = { customerId: string; expiresAt: number };
type SessionStore = Record<string, StoredSession>;

function load(): SessionStore {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as SessionStore) : {};
  } catch {
    return {};
  }
}

function save(store: SessionStore) {
  try {
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  } catch {
    // Storage unavailable (e.g. private mode limits): sessions last until refresh
  }
}

/** A 256-bit random token: unguessable, and meaningless without the server's records. */
function randomToken(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

export function createSession(customerId: string) {
  const store = load();
  const token = randomToken();
  const expiresAt = Date.now() + SESSION_TTL_MS;
  store[token] = { customerId, expiresAt };
  save(store);
  return { token, expiresAt };
}

/**
 * Returns the session if it is still valid and extends it (sliding expiry).
 * Expired or unknown tokens return null, and expired ones are removed.
 */
export function touchSession(token: string): StoredSession | null {
  const store = load();
  const session = store[token];
  if (!session) return null;

  if (session.expiresAt <= Date.now()) {
    delete store[token];
    save(store);
    return null;
  }

  session.expiresAt = Date.now() + SESSION_TTL_MS;
  save(store);
  return session;
}

export function deleteSession(token: string) {
  const store = load();
  delete store[token];
  save(store);
}
