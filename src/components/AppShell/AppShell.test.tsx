import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { findUser } from '../../mocks/db';
import { renderWithProviders } from '../../test/render';
import { AppShell } from './AppShell';

const renderShell = (signedInAs?: string) =>
  renderWithProviders(
    <AppShell>
      <p>Page content</p>
    </AppShell>,
    { signedInAs },
  );

const accountButton = (name: RegExp) => screen.findByRole('button', { name });
const accountPanel = () => screen.queryByRole('region', { name: 'Your account' });

describe('AppShell', () => {
  it('shows the signed-in customer once loaded', async () => {
    renderShell(); // signed in as cust_001, the default

    expect(await screen.findByText('Thandi Mokoena')).toBeInTheDocument();
    expect(screen.getByText('Premium account')).toBeInTheDocument();
  });

  it('shows whichever customer is signed in', async () => {
    renderShell('cust_002');

    expect(await screen.findByText('Mduduzi Mdluli')).toBeInTheDocument();
    expect(screen.getByText('Standard account')).toBeInTheDocument();
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
});

describe('AppShell account details', () => {
  it('opens the customer’s details, with a way to sign out', async () => {
    const user = userEvent.setup();
    renderShell();
    const button = await accountButton(/Thandi Mokoena/);

    expect(button).toHaveAttribute('aria-expanded', 'false');
    await user.click(button);

    expect(button).toHaveAttribute('aria-expanded', 'true');
    const panel = accountPanel();
    expect(panel).toHaveTextContent(findUser('cust_001')?.email ?? '');
    expect(panel).toHaveTextContent('Customer since');
    expect(panel).toHaveTextContent('Total spent');
    expect(within(panel!).getByRole('button', { name: 'Sign out' })).toBeInTheDocument();
  });

  it('closes with Escape and returns focus to the button', async () => {
    const user = userEvent.setup();
    renderShell();
    const button = await accountButton(/Thandi Mokoena/);

    await user.click(button);
    await user.keyboard('{Escape}');

    expect(accountPanel()).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });

  it('closes when clicking elsewhere', async () => {
    const user = userEvent.setup();
    renderShell();

    await user.click(await accountButton(/Thandi Mokoena/));
    await user.click(screen.getByText('Page content'));

    expect(accountPanel()).not.toBeInTheDocument();
  });
});
