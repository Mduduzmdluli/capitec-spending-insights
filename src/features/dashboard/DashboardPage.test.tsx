import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { DashboardPage } from './DashboardPage';

const searchParams = (search: string | undefined) => new URLSearchParams(search);

describe('DashboardPage period selector', () => {
  it('defaults to the last 30 days', () => {
    renderWithProviders(<DashboardPage />);
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked();
  });

  it('reads the period from the URL', () => {
    renderWithProviders(<DashboardPage />, { route: '/?period=90d' });
    expect(screen.getByRole('radio', { name: '90 days' })).toBeChecked();
  });

  it('falls back to the default for an unknown period', () => {
    renderWithProviders(<DashboardPage />, { route: '/?period=forever' });
    expect(screen.getByRole('radio', { name: '30 days' })).toBeChecked();
  });

  it('stores the chosen period in the URL and keeps other parameters', async () => {
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<DashboardPage />, { route: '/?simulate=slow' });

    await user.click(screen.getByRole('radio', { name: '12 months' }));

    expect(screen.getByRole('radio', { name: '12 months' })).toBeChecked();
    const params = searchParams(getLocation()?.search);
    expect(params.get('period')).toBe('12m');
    expect(params.get('simulate')).toBe('slow');
  });

  it('removes the parameter when returning to the default', async () => {
    const user = userEvent.setup();
    const { getLocation } = renderWithProviders(<DashboardPage />, { route: '/?period=7d' });

    await user.click(screen.getByRole('radio', { name: '30 days' }));

    expect(searchParams(getLocation()?.search).has('period')).toBe(false);
  });
});
