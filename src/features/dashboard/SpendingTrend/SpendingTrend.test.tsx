import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { SpendingTrend } from './SpendingTrend';
import type { TrendPoint } from './trendFormat';

const TRENDS_URL = '*/api/customers/:customerId/spending/trends';
const range = { from: '2026-10-06', to: '2026-10-08' };

const respondWith = (points: TrendPoint[]) =>
  server.use(http.get(TRENDS_URL, () => HttpResponse.json({ interval: 'day', points })));

const points: TrendPoint[] = [
  { periodStart: '2026-10-06', totalCents: 10000 },
  { periodStart: '2026-10-07', totalCents: 0 },
  { periodStart: '2026-10-08', totalCents: 50000 },
];

describe('SpendingTrend', () => {
  it('shows a loading state first', () => {
    respondWith(points);
    renderWithProviders(<SpendingTrend period="7d" range={range} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading spending over time');
  });

  it('summarises the average and the highest day', async () => {
    respondWith(points);
    renderWithProviders(<SpendingTrend period="7d" range={range} />);

    const average = await screen.findByText('Average per day');
    expect(average.nextElementSibling).toHaveTextContent(/R\s200,00/);

    const highest = screen.getByText('Highest day');
    expect(highest.nextElementSibling).toHaveTextContent(/R\s500,00/);
    expect(highest.nextElementSibling).toHaveTextContent('Thu 8 Oct 2026');
  });

  it('provides the data as a table for screen readers', async () => {
    respondWith(points);
    renderWithProviders(<SpendingTrend period="7d" range={range} />);

    const table = await screen.findByRole('table', { name: 'Spending per day' });
    const rows = within(table).getAllByRole('row');
    expect(rows).toHaveLength(4); // header + 3 days
    expect(rows[1]).toHaveTextContent('Tue 6 Oct 2026');
    expect(rows[1]).toHaveTextContent(/R\s100,00/);
  });

  it('says so when nothing was spent', async () => {
    respondWith(points.map((point) => ({ ...point, totalCents: 0 })));
    renderWithProviders(<SpendingTrend period="7d" range={range} />);

    expect(await screen.findByText('No spending in this period.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get(TRENDS_URL, () => HttpResponse.json({ message: 'Unavailable' }, { status: 500 })),
    );
    renderWithProviders(<SpendingTrend period="7d" range={range} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your spending over time',
    );
  });
});
