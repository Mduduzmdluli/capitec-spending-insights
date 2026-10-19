import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { SummaryResponse } from '../../../api/contract';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { SpendingSummary } from './SpendingSummary';

const SUMMARY_URL = '*/api/customers/:customerId/spending/summary';

const summary = (overrides: Partial<SummaryResponse> = {}): SummaryResponse => ({
  period: '30d',
  totalSpent: 18420.5,
  transactionCount: 142,
  averageTransaction: 129.72,
  topCategory: 'Groceries',
  comparedToPrevious: { spentChange: -12, transactionChange: 3 },
  ...overrides,
});

const changeOf = (spentChange: number | null) => ({ spentChange, transactionChange: null });

/** The period the component asked for in its most recent request */
let requestedPeriod: string | null = null;

const respondWith = (data: SummaryResponse) =>
  server.use(
    http.get(SUMMARY_URL, ({ request }) => {
      requestedPeriod = new URL(request.url).searchParams.get('period');
      return HttpResponse.json(data);
    }),
  );

const region = () => screen.getByRole('region', { name: 'Spending summary' });

describe('SpendingSummary', () => {
  it('shows a loading state, then the summary', async () => {
    respondWith(summary());
    renderWithProviders(<SpendingSummary period="30d" />);

    expect(screen.getByRole('status')).toHaveTextContent('Loading your spending summary');
    expect(await screen.findByText('142')).toBeInTheDocument();
  });

  it('asks the API for the selected period', async () => {
    respondWith(summary({ period: '90d' }));
    renderWithProviders(<SpendingSummary period="90d" />);

    await screen.findByText('142');
    expect(requestedPeriod).toBe('90d');
  });

  it('describes total spending and a decrease in plain language', async () => {
    respondWith(summary());
    renderWithProviders(<SpendingSummary period="30d" />);

    await screen.findByText('142');
    expect(region()).toHaveTextContent(/You’ve spent R\s18\s420,50 in the last 30 days\./);
    expect(screen.getByText('That’s 12% less than the previous 30 days.')).toBeInTheDocument();
    expect(screen.getByText('Groceries')).toBeInTheDocument();
  });

  it('describes an increase', async () => {
    respondWith(summary({ period: '7d', comparedToPrevious: changeOf(12) }));
    renderWithProviders(<SpendingSummary period="7d" />);

    expect(
      await screen.findByText('That’s 12% more than the previous 7 days.'),
    ).toBeInTheDocument();
  });

  it('describes a change that rounds to nothing as about the same', async () => {
    respondWith(summary({ comparedToPrevious: changeOf(0.3) }));
    renderWithProviders(<SpendingSummary period="30d" />);

    expect(await screen.findByText('About the same as the previous 30 days.')).toBeInTheDocument();
  });

  it('explains when there is nothing to compare against', async () => {
    respondWith(summary({ comparedToPrevious: changeOf(null) }));
    renderWithProviders(<SpendingSummary period="30d" />);

    expect(
      await screen.findByText('There’s no spending in the previous 30 days to compare with.'),
    ).toBeInTheDocument();
  });

  it('handles a period with no spending', async () => {
    respondWith(
      summary({
        totalSpent: 0,
        transactionCount: 0,
        averageTransaction: 0,
        topCategory: null,
        comparedToPrevious: changeOf(-100),
      }),
    );
    renderWithProviders(<SpendingSummary period="30d" />);

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
    renderWithProviders(<SpendingSummary period="30d" />);

    const alert = await screen.findByRole('alert');
    expect(alert).toHaveTextContent('We couldn’t load your spending summary');
    expect(alert).toHaveTextContent('Service unavailable');

    await user.click(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText(/You’ve spent/)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});
