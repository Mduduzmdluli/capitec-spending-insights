import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CategoriesResponse } from '../../../api/contract';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { CategoryBreakdown } from './CategoryBreakdown';

const CATEGORIES_URL = '*/api/customers/:customerId/spending/categories';

type ApiCategory = CategoriesResponse['categories'][number];

const category = (
  name: string,
  amount: number,
  transactionCount: number,
  percentage: number,
): ApiCategory => ({
  name,
  amount,
  transactionCount,
  percentage,
  color: '#000000',
  icon: 'circle',
});

/** The period the component asked for in its most recent request */
let requestedPeriod: string | null = null;

const respondWith = (categories: ApiCategory[]) =>
  server.use(
    http.get(CATEGORIES_URL, ({ request }) => {
      requestedPeriod = new URL(request.url).searchParams.get('period');
      return HttpResponse.json({
        dateRange: { startDate: '2026-09-11', endDate: '2026-10-10' },
        totalAmount: categories.reduce((total, entry) => total + entry.amount, 0),
        categories,
      });
    }),
  );

const sixCategories = [
  category('Groceries', 3000, 12, 50),
  category('Dining', 1200, 8, 20),
  category('Transportation', 600, 6, 10),
  category('Fuel', 600, 2, 10),
  category('Shopping', 300, 1, 5),
  category('Health & Fitness', 300, 3, 5),
];

const listItems = () => within(screen.getByRole('list')).getAllByRole('listitem');

describe('CategoryBreakdown', () => {
  it('shows a loading state first', () => {
    respondWith(sixCategories);
    renderWithProviders(<CategoryBreakdown period="30d" />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading spending by category');
  });

  it('asks the API for the selected period', async () => {
    respondWith(sixCategories);
    renderWithProviders(<CategoryBreakdown period="90d" />);

    await screen.findByText('Groceries');
    expect(requestedPeriod).toBe('90d');
  });

  it('ranks the top five categories with amount, payments and share', async () => {
    respondWith(sixCategories);
    renderWithProviders(<CategoryBreakdown period="30d" />);

    await screen.findByText('Groceries');
    const items = listItems();
    expect(items).toHaveLength(5);

    expect(items[0]).toHaveTextContent('Groceries');
    expect(items[0]).toHaveTextContent(/R\s3\s000,00/);
    expect(items[0]).toHaveTextContent('12 payments');
    expect(items[0]).toHaveTextContent('50% of spending');

    expect(items[1]).toHaveTextContent('Eating out'); // the app's label for "Dining"
    expect(items[4]).toHaveTextContent('Shopping');
    expect(items[4]).toHaveTextContent('1 payment');
  });

  it('reveals the remaining categories on request', async () => {
    respondWith(sixCategories);
    const user = userEvent.setup();
    renderWithProviders(<CategoryBreakdown period="30d" />);

    const toggle = await screen.findByRole('button', { name: 'Show 1 more category' });
    expect(toggle).toHaveAttribute('aria-expanded', 'false');

    await user.click(toggle);

    expect(listItems()).toHaveLength(6);
    expect(screen.getByText('Health & fitness')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Show fewer' })).toHaveAttribute(
      'aria-expanded',
      'true',
    );
  });

  it('has no toggle when every category fits', async () => {
    respondWith(sixCategories.slice(0, 3));
    renderWithProviders(<CategoryBreakdown period="30d" />);

    await screen.findByText('Groceries');
    expect(screen.queryByRole('button', { name: /more categor/ })).not.toBeInTheDocument();
  });

  it('says so when nothing was spent', async () => {
    respondWith([]);
    renderWithProviders(<CategoryBreakdown period="30d" />);
    expect(await screen.findByText('No spending in this period.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get(CATEGORIES_URL, () =>
        HttpResponse.json({ message: 'Unavailable' }, { status: 500 }),
      ),
    );
    renderWithProviders(<CategoryBreakdown period="30d" />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your spending by category',
    );
  });
});

describe('CategoryBreakdown selection', () => {
  it('filters transactions by the chosen category, and clears on a second press', async () => {
    respondWith(sixCategories);
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<CategoryBreakdown period="30d" />);
    const params = () => new URLSearchParams(getLocation()?.search);

    const groceries = await screen.findByRole('button', { name: /^Groceries/ });
    expect(groceries).toHaveAttribute('aria-pressed', 'false');

    await user.click(groceries);
    expect(params().get('category')).toBe('groceries');
    expect(groceries).toHaveAttribute('aria-pressed', 'true');

    await user.click(groceries);
    expect(params().has('category')).toBe(false);
    expect(groceries).toHaveAttribute('aria-pressed', 'false');
  });
});
