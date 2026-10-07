import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Money } from './Money';

describe('Money', () => {
  it('renders the formatted amount', () => {
    render(<Money cents={150000} />);
    expect(screen.getByText(/R\s1\s500,00/)).toBeInTheDocument();
  });
});
