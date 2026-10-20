import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';
import { afterEach, describe, expect, it } from 'vitest';
import App from '../App';
import { resetAllAttempts } from '../mocks/loginAttempts';
import { server } from '../mocks/server';
import { MDUDUZI, THANDI } from '../test/credentials';
import { renderWithProviders } from '../test/render';

type User = ReturnType<typeof userEvent.setup>;

async function signIn(user: User, username: string, password: string) {
  await user.type(screen.getByLabelText('Username'), username);
  await user.type(screen.getByLabelText('Password'), password);
  await user.click(screen.getByRole('button', { name: 'Sign in' }));
}

afterEach(() => {
  resetAllAttempts();
});

describe('signing in', () => {
  it('asks for sign-in before showing any data', () => {
    renderWithProviders(<App />, { signedInAs: null });

    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.queryByText('Your spending')).not.toBeInTheDocument();
  });

  it('signs in and returns to the view that was asked for', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { signedInAs: null, route: '/?period=90d' });

    await signIn(user, THANDI.username, THANDI.password);

    // Stage 1: signed in, because the header shows Thandi's account
    expect(await screen.findByText('Premium account')).toBeInTheDocument();
    // Stage 2: returned to the requested view
    expect(screen.getByRole('radio', { name: '90 days' })).toBeChecked();
    // Stage 3: the dashboard's data has loaded
    expect(await screen.findByText(/You’ve spent/, {}, { timeout: 3000 })).toBeInTheDocument();
  });

  it('shows each customer their own details', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { signedInAs: null });

    await signIn(user, MDUDUZI.username, MDUDUZI.password);

    // Wait for the dashboard: the name alone also appears in the sign-in page's demo list
    expect(await screen.findByText('Standard account')).toBeInTheDocument();
    expect(screen.getByText('Mduduzi Mdluli')).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Sign in' })).not.toBeInTheDocument();
  });

  it('explains a failed sign-in and clears the password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { signedInAs: null });

    await signIn(user, THANDI.username, 'wrong-password');

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'The username or password is incorrect.',
    );
    expect(screen.getByLabelText('Password')).toHaveValue('');
    expect(screen.getByLabelText('Username')).toHaveValue(THANDI.username);
  });

  it('checks for missing details before sending anything', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { signedInAs: null });

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    expect(screen.getByText('Enter your username.')).toBeInTheDocument();
    expect(screen.getByText('Enter your password.')).toBeInTheDocument();
    expect(screen.getByLabelText('Username')).toHaveAttribute('aria-invalid', 'true');
    expect(screen.getByLabelText('Username')).toHaveFocus();
  });

  it('can show and hide the password', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />, { signedInAs: null });
    const password = screen.getByLabelText('Password');

    expect(password).toHaveAttribute('type', 'password');
    await user.click(screen.getByRole('button', { name: 'Show password' }));
    expect(password).toHaveAttribute('type', 'text');
    await user.click(screen.getByRole('button', { name: 'Hide password' }));
    expect(password).toHaveAttribute('type', 'password');
  });
});

describe('signing out', () => {
  it('signs out and asks for sign-in again', async () => {
    const user = userEvent.setup();
    renderWithProviders(<App />);

    await user.click(await screen.findByRole('button', { name: /Thandi Mokoena/ }));
    await user.click(screen.getByRole('button', { name: 'Sign out' }));

    expect(await screen.findByRole('heading', { name: 'Sign in' })).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('You’ve signed out.');
  });

  it('signs out and explains why when the session has expired', async () => {
    server.use(
      http.get('*/api/customers/:customerId/spending/summary', () =>
        HttpResponse.json({ message: 'Your session has expired.' }, { status: 401 }),
      ),
    );
    renderWithProviders(<App />);

    expect(
      await screen.findByText('Your session has expired. Please sign in again.'),
    ).toBeInTheDocument();
  });
});
