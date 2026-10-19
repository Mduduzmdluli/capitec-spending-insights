import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { describe, expect, it } from 'vitest';
import type { GoalsResponse } from '../../../api/contract';
import { server } from '../../../mocks/server';
import { renderWithProviders } from '../../../test/render';
import { BudgetGoals } from './BudgetGoals';

const GOALS_URL = '*/api/customers/:customerId/goals';

type ApiGoal = GoalsResponse['goals'][number];

const goals: ApiGoal[] = [
  {
    id: 'goal_001',
    category: 'Entertainment',
    monthlyBudget: 1000,
    currentSpent: 650.3,
    percentageUsed: 65.03,
    daysRemaining: 12,
    status: 'on_track',
  },
  {
    id: 'goal_002',
    category: 'Groceries',
    monthlyBudget: 1500,
    currentSpent: 1450.8,
    percentageUsed: 96.72,
    daysRemaining: 12,
    status: 'warning',
  },
  {
    id: 'goal_003',
    category: 'Dining',
    monthlyBudget: 800,
    currentSpent: 920,
    percentageUsed: 115,
    daysRemaining: 12,
    status: 'exceeded',
  },
];

const respondWith = (data: ApiGoal[]) =>
  server.use(http.get(GOALS_URL, () => HttpResponse.json({ goals: data })));

const items = () => within(screen.getByRole('list')).getAllByRole('listitem');
const itemFor = (label: string) => screen.getByText(label).closest('li');

describe('BudgetGoals', () => {
  it('shows a loading state first', () => {
    respondWith(goals);
    renderWithProviders(<BudgetGoals />);
    expect(screen.getByRole('status')).toHaveTextContent('Loading your budgets');
  });

  it('lists the most urgent budgets first', async () => {
    respondWith(goals);
    renderWithProviders(<BudgetGoals />);
    await screen.findByText('Groceries');

    expect(items().map((item) => item.querySelector('span:nth-child(2)')?.textContent)).toEqual([
      'Eating out',
      'Groceries',
      'Entertainment',
    ]);
  });

  it('shows spending against the budget, what is left and the days remaining', async () => {
    respondWith(goals);
    renderWithProviders(<BudgetGoals />);
    await screen.findByText('Entertainment');

    const entertainment = itemFor('Entertainment');
    expect(entertainment).toHaveTextContent('On track');
    expect(entertainment).toHaveTextContent(/R\s650,30\s*of\s*R\s1\s000,00/);
    expect(entertainment).toHaveTextContent(/R\s349,70\sleft/);
    expect(entertainment).toHaveTextContent('12 days left');

    expect(itemFor('Groceries')).toHaveTextContent('Close to limit');
  });

  it('shows how far over budget a goal is', async () => {
    respondWith(goals);
    renderWithProviders(<BudgetGoals />);
    await screen.findByText('Eating out');

    const dining = itemFor('Eating out');
    expect(dining).toHaveTextContent('Over budget');
    expect(dining).toHaveTextContent(/R\s120,00\sover budget/);
  });

  it('says so when no budgets are set', async () => {
    respondWith([]);
    renderWithProviders(<BudgetGoals />);
    expect(await screen.findByText('You haven’t set any monthly budgets yet.')).toBeInTheDocument();
  });

  it('shows an error state when the request fails', async () => {
    server.use(
      http.get(GOALS_URL, () => HttpResponse.json({ message: 'Unavailable' }, { status: 500 })),
    );
    renderWithProviders(<BudgetGoals />);

    expect(await screen.findByRole('alert')).toHaveTextContent('We couldn’t load your budgets');
  });
});
