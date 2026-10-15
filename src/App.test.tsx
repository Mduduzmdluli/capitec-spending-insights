import { screen } from '@testing-library/react';
import axe from 'axe-core';
import { describe, expect, it } from 'vitest';
import App from './App';
import { renderWithProviders } from './test/render';

/** Runs axe on the rendered page and lists any problems, one line each. */
async function accessibilityViolations(container: HTMLElement) {
  const results = await axe.run(container, {
    // jsdom can't compute colours; contrast is checked manually with Lighthouse
    rules: { 'color-contrast': { enabled: false } },
  });
  return results.violations.map((violation) => `${violation.id}: ${violation.help}`);
}

describe('App accessibility', () => {
  it('has no detectable accessibility violations on the dashboard', async () => {
    const { container } = renderWithProviders(<App />);

    // Wait for every section to show real data, not skeletons
    await screen.findByText(/You’ve spent/);
    await screen.findByText(/^Average per/);
    await screen.findByRole('button', { name: /more categor/ });
    await screen.findByText(/^Showing /);

    expect(await accessibilityViolations(container)).toEqual([]);
  }, 15000);

  it('has no detectable accessibility violations on the sign-in page', async () => {
    const { container } = renderWithProviders(<App />, { signedInAs: null });
    await screen.findByRole('heading', { name: 'Sign in' });

    expect(await accessibilityViolations(container)).toEqual([]);
  });
});
