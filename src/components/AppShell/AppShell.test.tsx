import { screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { renderWithProviders } from '../../test/render';
import { AppShell } from './AppShell';

const renderShell = (signedInAs?: string) =>
  renderWithProviders(
    <AppShell>
      <p>Page content</p>
    </AppShell>,
    { signedInAs },
  );

describe('AppShell', () => {
  it('shows the signed-in customer once loaded', async () => {
    renderShell(); // signed in as cust_001, the default

    expect(await screen.findByText('Thandi Mokoena')).toBeInTheDocument();
    expect(screen.getByText('Account ending in 4821')).toBeInTheDocument();
  });

  it('shows whichever customer is signed in', async () => {
    renderShell('cust_002');

    expect(await screen.findByText('Mduduzi Mdluli')).toBeInTheDocument();
    expect(screen.getByText('Account ending in 7310')).toBeInTheDocument();
  });

  it('renders page content inside the main landmark', () => {
    renderShell();
    expect(screen.getByRole('main')).toHaveTextContent('Page content');
  });

  it('offers a skip link to the main content', () => {
    renderShell();
    expect(screen.getByRole('link', { name: 'Skip to main content' })).toHaveAttribute(
      'href',
      '#main',
    );
  });

  it('offers a way to sign out', () => {
    renderShell();
    expect(screen.getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });
});
