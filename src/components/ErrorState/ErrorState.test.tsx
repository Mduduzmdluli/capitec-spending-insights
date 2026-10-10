import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ErrorState } from './ErrorState';

describe('ErrorState', () => {
  it('announces the problem to assistive technology', () => {
    render(<ErrorState title="Something failed" message="Please try again." />);
    expect(screen.getByRole('alert')).toHaveTextContent('Something failed');
    expect(screen.getByRole('alert')).toHaveTextContent('Please try again.');
  });

  it('calls onRetry when the button is pressed', async () => {
    const onRetry = vi.fn();
    render(<ErrorState title="Something failed" onRetry={onRetry} />);

    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));

    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('disables the button while retrying', () => {
    render(<ErrorState title="Something failed" onRetry={() => {}} isRetrying />);
    expect(screen.getByRole('button', { name: 'Trying again…' })).toBeDisabled();
  });

  it('hides the retry button when no handler is given', () => {
    render(<ErrorState title="Something failed" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });
});
