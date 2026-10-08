import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { AppShell } from './AppShell';

describe('AppShell', () => {
  it('shows the signed-in customer once loaded', async () => {
    renderWithProviders(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    expect(await screen.findByText('Thandi Mokoena')).toBeInTheDocument();
    expect(screen.getByText('Account ending in 4821')).toBeInTheDocument();
  });

  it('renders page content inside the main landmark', () => {
    renderWithProviders(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });

  it('offers a skip link to the main content', () => {
    renderWithProviders(
      <AppShell>
        <p>Page content</p>
      </AppShell>,
    );

    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
  });
});
