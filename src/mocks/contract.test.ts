import { describe, expect, it } from 'vitest';
import {
  categoriesResponseSchema,
  profileResponseSchema,
  summaryResponseSchema,
  transactionsResponseSchema,
  trendsResponseSchema,
} from '../api/contract';
import { createSession } from './sessions';

const apiUrl = (path: string) => new URL(path, window.location.origin);

/** Calls one of cust_001's endpoints with a valid session. */
async function request(path: string) {
  const { token } = createSession('cust_001');
  return fetch(apiUrl(`/api/customers/cust_001${path}`), {
    headers: { Authorization: `Bearer ${token}` },
  });
}

async function getJson(path: string) {
  const response = await request(path);
  expect(response.status).toBe(200);
  return response.json();
}

describe('the documented API contract', () => {
  it('1. serves the customer profile', async () => {
    const profile = profileResponseSchema.parse(await getJson('/profile'));
    expect(profile).toMatchObject({ customerId: 'cust_001', currency: 'ZAR' });
  });

  it('2. serves the spending summary for each period, defaulting to 30d', async () => {
    for (const period of ['7d', '30d', '90d', '1y'] as const) {
      const summary = summaryResponseSchema.parse(
        await getJson(`/spending/summary?period=${period}`),
      );
      expect(summary.period).toBe(period);
    }
    expect(summaryResponseSchema.parse(await getJson('/spending/summary')).period).toBe('30d');
  });

  it('3. serves spending by category for a period or a custom date range', async () => {
    categoriesResponseSchema.parse(await getJson('/spending/categories?period=90d'));

    const custom = categoriesResponseSchema.parse(
      await getJson('/spending/categories?startDate=2026-01-01&endDate=2026-01-31'),
    );
    expect(custom.dateRange).toEqual({ startDate: '2026-01-01', endDate: '2026-01-31' });
  });

  it('3. rejects a custom range with only one date', async () => {
    const response = await request('/spending/categories?startDate=2026-01-01');
    expect(response.status).toBe(400);
  });

  it('4. serves monthly trends for the requested number of months', async () => {
    const { trends } = trendsResponseSchema.parse(await getJson('/spending/trends?months=6'));
    expect(trends).toHaveLength(6);

    const defaults = trendsResponseSchema.parse(await getJson('/spending/trends'));
    expect(defaults.trends).toHaveLength(12);
  });

  it('4. rejects more than 24 months', async () => {
    const response = await request('/spending/trends?months=25');
    expect(response.status).toBe(400);
  });

  it('5. serves transactions with offset pagination', async () => {
    const page = transactionsResponseSchema.parse(await getJson('/transactions?limit=5&offset=5'));

    expect(page.transactions.length).toBeLessThanOrEqual(5);
    expect(page.pagination).toMatchObject({ limit: 5, offset: 5 });
    expect(page.pagination.hasMore).toBe(page.pagination.offset + 5 < page.pagination.total);
  });

  it('5. filters transactions by category name and date range', async () => {
    const page = transactionsResponseSchema.parse(
      await getJson(
        '/transactions?category=Groceries&startDate=2026-01-01&endDate=2026-03-31&limit=100',
      ),
    );

    expect(page.transactions.every((t) => t.category === 'Groceries')).toBe(true);
    expect(page.transactions.every((t) => t.date >= '2026-01-01' && t.date < '2026-04-01')).toBe(
      true,
    );
  });

  it('5. rejects an unknown category and a limit over 100', async () => {
    expect((await request('/transactions?category=Gambling')).status).toBe(400);
    expect((await request('/transactions?limit=101')).status).toBe(400);
  });
});
