import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TransactionsResponse, FiltersResponse } from '../../../api/contract';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { Transactions } from './Transactions';

const TRANSACTIONS_URL = '*/api/customers/:customerId/transactions';
const range = { from: '2026-09-11', to: '2026-10-10' };

type ApiTransaction = TransactionsResponse['transactions'][number];

const tx = (overrides: Partial<ApiTransaction> & Pick<ApiTransaction, 'id' | 'date'>) => ({
  merchant: 'Checkers',
  category: 'Groceries',
  amount: 432.1,
  paymentMethod: 'Debit Card',
  ...overrides,
});

const transactions: ApiTransaction[] = [
  tx({ id: 't1', date: '2026-10-10T08:00:00.000Z' }),
  tx({
    id: 't2',
    date: '2026-10-09T08:00:00.000Z',
    merchant: "Nando's",
    category: 'Dining',
    amount: 189.5,
  }),
  tx({
    id: 't3',
    date: '2026-10-07T08:00:00.000Z',
    merchant: 'Netflix',
    category: 'Entertainment',
    amount: 199,
    paymentMethod: 'Debit Order',
    description: 'Monthly subscription',
  }),
];

const page = (
  items: ApiTransaction[],
  { total = items.length, offset = 0, limit = 20 } = {},
): TransactionsResponse => ({
  transactions: items,
  pagination: { total, limit, offset, hasMore: offset + items.length < total },
});

/** The query parameters of the most recent request, to check what the component asked for */
let lastRequest = new URLSearchParams();

const respondWith = (data: TransactionsResponse) =>
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

  it('asks the API for the period using the documented parameters', async () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);
    await screen.findByText('Checkers');

    expect(lastRequest.get('startDate')).toBe(range.from);
    expect(lastRequest.get('endDate')).toBe(range.to);
    expect(lastRequest.get('limit')).toBe('20');
    expect(lastRequest.get('offset')).toBe('0');
    expect(lastRequest.get('sortBy')).toBe('date_desc');
  });

  it('groups transactions under friendly day headings', async () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);

    expect(await screen.findByRole('heading', { name: 'Today' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Yesterday' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Wednesday 7 October' })).toBeInTheDocument();
  });

  it('shows amounts clearly, including to screen readers, and labels debit orders', async () => {
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);

    const checkers = (await screen.findByText('Checkers')).closest('li');
    expect(checkers).toHaveTextContent(/Spent\s−R\s432,10/);

    const netflix = screen.getByText('Netflix').closest('li');
    expect(netflix).toHaveTextContent(/Spent\s−R\s199,00/);
    expect(netflix).toHaveTextContent('Debit order');
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

    await waitFor(() => expect(lastRequest.get('search')).toBe('nando'));
    expect(urlParams(getLocation).get('q')).toBe('nando');
  });

  it("filters by category, sending the API's category name", async () => {
    respondWith(page(transactions));
    const user = userEvent.setup();
    renderWithProviders(<Transactions range={range} />);
    await screen.findByText('Checkers');

    await user.selectOptions(screen.getByRole('combobox', { name: 'Category' }), 'groceries');

    await waitFor(() => expect(lastRequest.get('category')).toBe('Groceries'));
  });

  it('switches to a flat list when sorting by amount', async () => {
    respondWith(page(transactions));
    const user = userEvent.setup();
    renderWithProviders(<Transactions range={range} />);
    await screen.findByRole('heading', { name: 'Today' });

    await user.selectOptions(screen.getByRole('combobox', { name: 'Sort by' }), 'amount_desc');

    await waitFor(() => expect(lastRequest.get('sortBy')).toBe('amount_desc'));
    expect(screen.queryByRole('heading', { name: 'Today' })).not.toBeInTheDocument();
  });

  it('moves between pages, sending the offset the API expects', async () => {
    respondWith(page(transactions, { total: 45 }));
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<Transactions range={range} />);

    expect(await screen.findByRole('button', { name: 'Previous' })).toBeDisabled();
    expect(screen.getByText('Page 1 of 3')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Next' }));

    await waitFor(() => expect(lastRequest.get('offset')).toBe('20'));
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

  it('offers only the categories from the filters endpoint', async () => {
    const filters: FiltersResponse = {
      categories: [
        { name: 'Groceries', color: '#000000', icon: 'shopping-cart' },
        { name: 'Dining', color: '#000000', icon: 'utensils' },
      ],
      dateRangePresets: [],
    };
    server.use(http.get('*/api/customers/:customerId/filters', () => HttpResponse.json(filters)));
    respondWith(page(transactions));
    renderWithProviders(<Transactions range={range} />);

    const select = screen.getByRole('combobox', { name: 'Category' });
    await waitFor(() =>
      expect(
        within(select)
          .getAllByRole('option')
          .map((option) => option.textContent),
      ).toEqual(['All categories', 'Groceries', 'Eating out']),
    );
  });
});
