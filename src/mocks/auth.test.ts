import { afterEach, describe, expect, it } from 'vitest';
import { sessionSchema } from '../api/schemas';
import { findCustomer, getTransactions } from './db';
import { resetAllAttempts } from './loginAttempts';
import { touchSession } from './sessions';

const apiUrl = (path: string) => new URL(path, window.location.origin);

const login = (username: string, password: string) =>
  fetch(apiUrl('/api/auth/login'), {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  });

afterEach(() => {
  resetAllAttempts();
});

describe('mock sign-in API', () => {
  it('signs in with valid credentials and creates a session', async () => {
    const response = await login('thandim', 'Thandi@2026');

    expect(response.status).toBe(200);
    const session = sessionSchema.parse(await response.json());
    expect(session.customer.id).toBe('cust_001');
    expect(touchSession(session.token)?.customerId).toBe('cust_001');
  });

  it('ignores the case of the username and surrounding spaces', async () => {
    const response = await login(' MDLULIM ', 'Mdu@2026');
    expect(response.status).toBe(200);
  });

  it('gives the same response for an unknown username and a wrong password', async () => {
    const wrongPassword = await login('thandim', 'not-the-password');
    const unknownUser = await login('nobody', 'Spend@2026');

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownUser.json());
  });

  it('locks the username after five failed attempts, even with the right password', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await login('thandi', 'wrong');
    }

    const response = await login('thandi', 'Spend@2026');

    expect(response.status).toBe(429);
    expect((await response.json()).message).toMatch(/Too many unsuccessful attempts/);
  });

  it('rejects a missing username or password', async () => {
    const response = await login('', '');
    expect(response.status).toBe(400);
  });

  it('ends the session on sign-out', async () => {
    const { token } = sessionSchema.parse(await (await login('thandim', 'Thandi@2026')).json());

    const response = await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(204);
    expect(touchSession(token)).toBeNull();
  });
});

describe('mock customers', () => {
  it('has two customers, and nothing for unknown IDs', () => {
    expect(findCustomer('cust_001')?.firstName).toBe('Thandi');
    expect(findCustomer('cust_002')?.firstName).toBe('Mduduzi');
    expect(findCustomer('cust_999')).toBeUndefined();
  });

  it('gives each customer their own spending', () => {
    expect(getTransactions('cust_001')).not.toEqual(getTransactions('cust_002'));
    // Mduduzi has no car
    expect(getTransactions('cust_002').some((t) => t.category === 'fuel')).toBe(false);
  });
});
