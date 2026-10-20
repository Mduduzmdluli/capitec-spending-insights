import { act, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { InactivityGuard } from './InactivityGuard';

const timings = { timeoutMs: 10_000, warningMs: 5_000 };

function renderGuard() {
  const onTimeout = vi.fn();
  const onSignOut = vi.fn();
  render(<InactivityGuard onTimeout={onTimeout} onSignOut={onSignOut} {...timings} />);
  return { onTimeout, onSignOut };
}

/** Moves the fake clock forward, letting React update along the way */
const wait = (ms: number) => act(() => vi.advanceTimersByTime(ms));

const dialog = () => screen.queryByRole('alertdialog', { name: 'Are you still there?' });

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('InactivityGuard', () => {
  it('stays out of the way while the customer is active', () => {
    renderGuard();
    wait(4_000);
    expect(dialog()).not.toBeInTheDocument();
  });

  it('warns before signing out, with a countdown', () => {
    renderGuard();
    wait(6_000);

    expect(dialog()).toBeInTheDocument();
    expect(dialog()).toHaveTextContent('signed out in 4 seconds');
    expect(screen.getByRole('button', { name: 'Stay signed in' })).toHaveFocus();
  });

  it('signs out once the time runs out, exactly once', () => {
    const { onTimeout } = renderGuard();
    wait(15_000);
    expect(onTimeout).toHaveBeenCalledOnce();
  });

  it('restarts the clock when the customer chooses to stay', () => {
    const { onTimeout } = renderGuard();
    wait(6_000);

    fireEvent.click(screen.getByRole('button', { name: 'Stay signed in' }));
    expect(dialog()).not.toBeInTheDocument();

    wait(4_000);
    expect(dialog()).not.toBeInTheDocument();
    expect(onTimeout).not.toHaveBeenCalled();
  });

  it('treats any activity before the warning as the customer still being there', () => {
    renderGuard();
    wait(4_000);
    fireEvent.keyDown(window);
    wait(4_000);

    expect(dialog()).not.toBeInTheDocument();
  });

  it('lets the customer sign out straight away', () => {
    const { onSignOut } = renderGuard();
    wait(6_000);

    fireEvent.click(screen.getByRole('button', { name: 'Sign out now' }));
    expect(onSignOut).toHaveBeenCalledOnce();
  });
});
