import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { SpendingSummary as SummaryData } from '../../../api/schemas';
import { getDateRange } from '../../../lib/period';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { SpendingSummary } from './SpendingSummary';

const SUMMARY_URL = '*/api/customers/:customerId/summary';
const range = { from: '2026-09-09', to: '2026-10-08' };

const summary = (overrides: Partial<SummaryData> = {}): SummaryData => ({
  ...range,
  totalSpentCents: 1842050,
  previousPeriodSpentCents: 2093239,
  transactionCount: 142,
  averageTransactionCents: 12972,
  topCategory: 'groceries',
  ...overrides,
});

const respondWith = (data: SummaryData) =>
  server.use(http.get(SUMMARY_URL, () => HttpResponse.json(data)));

const region = () => screen.getByRole('region', { name: 'Spending summary' });

describe('SpendingSummary', () => {
  it('shows a loading state, then the summary', async () => {
    respondWith(summary());
    renderWithProviders(<SpendingSummary period="30d" range={range} />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your spending summary');
    expect(await screen.findByText('142')).toBeInTheDocument();
  });

  it('describes total spending and a decrease in plain language', async () => {
    respondWith(summary());
    renderWithProviders(<SpendingSummary period="30d" range={range} />);

    await screen.findByText('142');
    expect(region()).toHaveTextContent(/You’ve spent R\s18\s420,50 in the last 30 days\./);
    expect(screen.getByText('That’s 12% less than the previous 30 days.')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('describes an increase', async () => {
    respondWith(summary({ totalSpentCents: 11200, previousPeriodSpentCents: 10000 }));
    renderWithProviders(<SpendingSummary period="7d" range={range} />);

    expect(
      await screen.findByText('That’s 12% more than the previous 7 days.'),
    ).toBeInTheDocument();
  });

  it('explains when there is nothing to compare against', async () => {
    respondWith(summary({ previousPeriodSpentCents: 0 }));
    renderWithProviders(<SpendingSummary period="30d" range={range} />);

    expect(
      await screen.findByText('There’s no spending in the previous 30 days to compare with.'),
    ).toBeInTheDocument();
  });

  it('handles a period with no spending', async () => {
    respondWith(
      summary({
        totalSpentCents: 0,
        transactionCount: 0,
        averageTransactionCents: 0,
        topCategory: null,
      }),
    );
    renderWithProviders(<SpendingSummary period="30d" range={range} />);

    expect(
      await screen.findByText('You haven’t spent anything in the last 30 days.'),
    ).toBeInTheDocument();
    expect(screen.queryByText('Payments')).not.toBeInTheDocument();
  });

  it('shows an error with a working retry', async () => {
    // Fail once, then fall back to the normal mock API
    server.use(
      http.get(
        SUMMARY_URL,
        () => HttpResponse.json({ message: 'Service unavailable' }, { status: 503 }),
        { once: true },
      ),
    );
    const user = userEvent.setup();
    renderWithProviders(<SpendingSummary period="30d" range={getDateRange('30d')} />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We couldn’t load your spending summary');
    expect(alert).toHaveTextContent('Service unavailable');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/You’ve spent/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
