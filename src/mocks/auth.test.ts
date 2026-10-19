import { afterEach, describe, expect, it } from 'vitest';
import { sessionSchema } from '../api/schemas';
import { MDUDUZI, THANDI } from '../test/credentials';
import { findUser, getTransactions } from './db';
import { resetAllAttempts } from './loginAttempts';
import { createSession, touchSession } from './sessions';

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
    const response = await login(THANDI.username, THANDI.password);

    expect(response.status).toBe(200);
    const session = sessionSchema.parse(await response.json());
    expect(session.customer.id).toBe('cust_001');
    expect(touchSession(session.token)?.customerId).toBe('cust_001');
  });

  it('ignores the case of the username and surrounding spaces', async () => {
    const response = await login(`  ${MDUDUZI.username.toUpperCase()} `, MDUDUZI.password);
    expect(response.status).toBe(200);
  });

  it('gives the same response for an unknown username and a wrong password', async () => {
    const wrongPassword = await login(THANDI.username, 'not-the-password');
    const unknownUser = await login('nobody', THANDI.password);

    expect(wrongPassword.status).toBe(401);
    expect(unknownUser.status).toBe(401);
    expect(await wrongPassword.json()).toEqual(await unknownUser.json());
  });

  it('locks the username after five failed attempts, even with the right password', async () => {
    for (let attempt = 0; attempt < 5; attempt++) {
      await login(THANDI.username, 'wrong');
    }

    const response = await login(THANDI.username, THANDI.password);

    expect(response.status).toBe(429);
    expect((await response.json()).message).toMatch(/Too many unsuccessful attempts/);
  });

  it('rejects a missing username or password', async () => {
    const response = await login('', '');
    expect(response.status).toBe(400);
  });

  it('ends the session on sign-out', async () => {
    const { token } = sessionSchema.parse(
      await (await login(THANDI.username, THANDI.password)).json(),
    );

    const response = await fetch(apiUrl('/api/auth/logout'), {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(response.status).toBe(204);
    expect(touchSession(token)).toBeNull();
  });
});

it('has two customers, and nothing for unknown IDs', () => {
  expect(findUser('cust_001')?.name).toBe('Thandi Mokoena');
  expect(findUser('cust_002')?.name).toBe('Mduduzi Mdluli');
  expect(findUser('cust_999')).toBeUndefined();
});

it('gives each customer their own spending', () => {
  expect(getTransactions('cust_001')).not.toEqual(getTransactions('cust_002'));
  // Mduduzi has no car
  expect(getTransactions('cust_002').some((t) => t.category === 'fuel')).toBe(false);
});

describe('protected customer data', () => {
  const summaryUrl = (customerId: string) =>
    apiUrl(`/api/customers/${customerId}/spending/summary?period=30d`);

  it('requires a session', async () => {
    const response = await fetch(summaryUrl('cust_001'));
    expect(response.status).toBe(401);
  });

  it('rejects an unknown token', async () => {
    const response = await fetch(summaryUrl('cust_001'), {
      headers: { Authorization: 'Bearer not-a-real-token' },
    });
    expect(response.status).toBe(401);
  });

  it("refuses another customer's data, even with a valid session", async () => {
    const { token } = createSession('cust_001');
    const headers = { Authorization: `Bearer ${token}` };

    const own = await fetch(summaryUrl('cust_001'), { headers });
    const someoneElses = await fetch(summaryUrl('cust_002'), { headers });

    expect(own.status).toBe(200);
    expect(someoneElses.status).toBe(403);
  });
});
