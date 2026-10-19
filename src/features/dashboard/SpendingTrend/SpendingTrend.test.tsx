import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { TrendsResponse } from '../../../api/contract';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { SpendingTrend } from './SpendingTrend';

const TRENDS_URL = '*/api/customers/:customerId/spending/trends';

type ApiTrend = TrendsResponse['trends'][number];

const trend = (month: string, totalSpent: number): ApiTrend => ({
  month,
  totalSpent,
  transactionCount: totalSpent > 0 ? 10 : 0,
  averageTransaction: totalSpent > 0 ? totalSpent / 10 : 0,
});

/** The number of months the component asked for in its most recent request */
let requestedMonths: string | null = null;

const respondWith = (trends: ApiTrend[]) =>
  server.use(
    http.get(TRENDS_URL, ({ request }) => {
      requestedMonths = new URL(request.url).searchParams.get('months');
      return HttpResponse.json({ trends });
    }),
  );

const trends = [trend('2026-08', 1000), trend('2026-09', 0), trend('2026-10', 5000)];

describe('SpendingTrend', () => {
  it('shows a loading state first', () => {
    respondWith(trends);
    renderWithProviders(<SpendingTrend />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading spending over time');
  });

  it('asks the API for the last 12 months', async () => {
    respondWith(trends);
    renderWithProviders(<SpendingTrend />);

    await screen.findByText('Average per month');
    expect(requestedMonths).toBe('12');
    expect(screen.getByText('Monthly totals for the last 12 months')).toBeInTheDocument();
  });

  it('summarises the average and the highest month', async () => {
    respondWith(trends);
    renderWithProviders(<SpendingTrend />);

    const average = await screen.findByText('Average per month');
    expect(average.nextElementSibling).toHaveTextContent(/R\s2\s000,00/);

    const highest = screen.getByText('Highest month');
    expect(highest.nextElementSibling).toHaveTextContent(/R\s5\s000,00/);
    expect(highest.nextElementSibling).toHaveTextContent('October 2026');
  });

  it('provides the data as a table for screen readers', async () => {
    respondWith(trends);
    renderWithProviders(<SpendingTrend />);

    const table = await screen.findByRole('table', { name: 'Spending per month' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4); // header + 3 months
    expect(rows[1]).toHaveTextContent('August 2026');
    expect(rows[1]).toHaveTextContent(/R\s1\s000,00/);
  });

  it('says so when nothing was spent', async () => {
    respondWith(trends.map((entry) => trend(entry.month, 0)));
    renderWithProviders(<SpendingTrend />);

    expect(await screen.findByText('No spending in this period.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get(TRENDS_URL, () => HttpResponse.json({ message: 'Unavailable' }, { status: 500 })),
    );
    renderWithProviders(<SpendingTrend />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your spending over time',
    );
  });
});
