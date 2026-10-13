import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Transaction, TransactionPage } from '../../../api/schemas';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { Transactions } from './Transactions';

const TRANSACTIONS_URL = '*/api/customers/:customerId/transactions';
const range = { from: '2026-09-11', to: '2026-10-10' };

const tx = (overrides: Partial<Transaction> & Pick<Transaction, 'id' | 'date'>): Transaction => ({
  merchant: 'Checkers',
  category: 'groceries',
  amountCents: 43210,
  type: 'debit',
  channel: 'card',
  ...overrides,
});

const transactions: Transaction[] = [
  tx({ id: 't1', date: '2026-10-10T08:00:00.000Z' }),
  tx({
    id: 't2',
    date: '2026-10-09T08:00:00.000Z',
    merchant: "Nando's",
    category: 'dining',
    amountCents: 18950,
  }),
  tx({
    id: 't3',
    date: '2026-10-07T08:00:00.000Z',
    merchant: 'Salary: Acme (Pty) Ltd',
    category: 'income',
    amountCents: 3250000,
    type: 'credit',
    channel: 'eft',
  }),
];

const page = (items: Transaction[], overrides: Partial<TransactionPage> = {}): TransactionPage => ({
  items,
  page: 1,
  pageSize: 20,
  totalItems: items.length,
  totalPages: 1,
  ...overrides,
});

/** The query parameters of the most recent request, to check what the component asked for */
let lastRequest = new URLSearchParams();

const respondWith = (data: TransactionPage) =>
  server.use(
    http.get(TRANSACTIONS_URL, ({ request }) => {
      lastRequest = new URL(request.url).searchParams;
      return HttpResponse.json(data);
    }),
  );

const urlParams = (getLocation: () => { search: string } | null) =>
  new URLSearchParams(getLocation()?.search);

beforeEach(() => {
  // Freeze only the date, so "Today" is predictable but timers still run normally
  vi.useFakeTimers({ toFake: ['Date'] });
  vi.setSystemTime(new Date(2026, 9, 10, 12));
});

afterEach(() => {
  vi.useRealTimers();
});

describe('Transactions', () => {
  it('shows a loading state first', () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading transactions');
  });

  it('groups transactions under friendly day headings', async () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Wednesday 7 October' })).toBeInTheDocument();
  });

  it('makes money in and out clear, including to screen readers', async () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);

    const checkers = (await screen.findByText('Checkers')).closest('li');
    expect(checkers).toHaveTextContent(/Spent\s−R\s432,10/);

    const salary = screen.getByText('Salary: Acme (Pty) Ltd').closest('li');
    expect(salary).toHaveTextContent(/Received\s\+R\s32\s500,00/);
    expect(salary).toHaveTextContent('EFT');
  });

  it('summarises which results are shown', async () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);
    expect(await screen.findByText('Showing 1–3 of 3 transactions')).toBeInTheDocument();
  });

  it('searches after a short pause in typing', async () => {
    respondWith(page(transactions));
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<Transactions range={range} />);
    await screen.findByText('Checkers');

    await user.type(screen.getByRole('searchbox', { name: 'Search transactions' }), 'nando');

    await waitFor(() => expect(lastRequest.get('q')).toBe('nando'));
    expect(urlParams(getLocation).get('q')).toBe('nando');
  });

  it('filters by category', async () => {
    respondWith(page(transactions));
    const user = userEvent.setup();
    renderWithProviders(<Transactions range={range} />);
    await screen.findByText('Checkers');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'groceries');

    await waitFor(() => expect(lastRequest.get('category')).toBe('groceries'));
  });

  it('switches to a flat list when sorting by amount', async () => {
    respondWith(page(transactions));
    const user = userEvent.setup();
    renderWithProviders(<Transactions range={range} />);
    await screen.findByRole('heading', { name: 'Today' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'amount_desc');

    await waitFor(() => expect(lastRequest.get('sort')).toBe('amount_desc'));
    expect(screen.queryByRole('heading', { name: 'Today' })).not.toBeInTheDocument();
  });

  it('moves between pages', async () => {
    respondWith(page(transactions, { totalItems: 45, totalPages: 3 }));
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<Transactions range={range} />);

    expect(await screen.findByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(lastRequest.get('page')).toBe('2'));
    expect(urlParams(getLocation).get('page')).toBe('2');
  });

  it('offers to clear filters when nothing matches', async () => {
    respondWith(page([]));
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<Transactions range={range} />, {
      route: '/?q=zzz',
    });

    expect(await screen.findByText('No transactions match your filters.')).toBeInTheDocument();
    const searchbox = screen.getByRole('searchbox', { name: 'Search transactions' });
    expect(searchbox).toHaveValue('zzz');

    await user.click(screen.getByRole('button', { name: 'Clear filters' }));

    expect(urlParams(getLocation).has('q')).toBe(false);
    expect(searchbox).toHaveValue('');
  });

  it('says so when there are no transactions at all', async () => {
    respondWith(page([]));
    renderWithProviders(<Transactions range={range} />);
    expect(await screen.findByText('No transactions in this period.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get(TRANSACTIONS_URL, () =>
        HttpResponse.json({ message: 'Unavailable' }, { status: 500 }),
      ),
    );
    renderWithProviders(<Transactions range={range} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your transactions',
    );
  });
});
