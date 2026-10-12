import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { CategoryBreakdown as BreakdownData } from '../../../api/schemas';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { CategoryBreakdown } from './CategoryBreakdown';

const CATEGORIES_URL = '*/api/customers/:customerId/spending/categories';
const range = { from: '2026-09-11', to: '2026-10-10' };

const respondWith = (categories: BreakdownData['categories']) =>
  server.use(http.get(CATEGORIES_URL, () => HttpResponse.json({ categories })));

const sixCategories: BreakdownData['categories'] = [
  { category: 'groceries', totalCents: 300000, transactionCount: 12, percentage: 50 },
  { category: 'dining', totalCents: 120000, transactionCount: 8, percentage: 20 },
  { category: 'transport', totalCents: 60000, transactionCount: 6, percentage: 10 },
  { category: 'fuel', totalCents: 60000, transactionCount: 2, percentage: 10 },
  { category: 'shopping', totalCents: 30000, transactionCount: 1, percentage: 5 },
  { category: 'health', totalCents: 30000, transactionCount: 3, percentage: 5 },
];

const listItems = () => within(screen.getByRole('list')).getAllByRole('listitem');

describe('CategoryBreakdown', () => {
  it('shows a loading state first', () => {
    respondWith(sixCategories);
    renderWithProviders(<CategoryBreakdown range={range} />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading spending by category');
  });

  it('ranks the top five categories with amount, payments and share', async () => {
    respondWith(sixCategories);
    renderWithProviders(<CategoryBreakdown range={range} />);

    await screen.findByText('Groceries');
    const items = listItems();
    expect(items).toHaveLength(5);

    expect(items[0]).toHaveTextContent('Groceries');
    expect(items[0]).toHaveTextContent(/R\s3\s000,00/);
    expect(items[0]).toHaveTextContent('12 payments');
    expect(items[0]).toHaveTextContent('50% of spending');

    expect(items[4]).toHaveTextContent('Shopping');
    expect(items[4]).toHaveTextContent('1 payment');
  });

  it('reveals the remaining categories on request', async () => {
    respondWith(sixCategories);
    const user = userEvent.setup();
    renderWithProviders(<CategoryBreakdown range={range} />);

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
    renderWithProviders(<CategoryBreakdown range={range} />);

    await screen.findByText('Groceries');
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('says so when nothing was spent', async () => {
    respondWith([]);
    renderWithProviders(<CategoryBreakdown range={range} />);
    expect(await screen.findByText('No spending in this period.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get(CATEGORIES_URL, () =>
        HttpResponse.json({ message: 'Unavailable' }, { status: 500 }),
      ),
    );
    renderWithProviders(<CategoryBreakdown range={range} />);

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'We couldn’t load your spending by category',
    );
  });
});
