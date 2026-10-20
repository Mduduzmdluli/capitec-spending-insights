import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { PeriodSelector } from './PeriodSelector';

const periodNames = () => screen.getAllByRole('radio').map((radio) => radio.getAttribute('value'));

describe('PeriodSelector', () => {
  it('shows every period until the server says which are available', () => {
    render(<PeriodSelector value="30d" onChange={() => {}} />);
    expect(periodNames()).toEqual(['7d', '30d', '90d', '1y']);
  });

  it('shows only the periods the server offers', () => {
    render(<PeriodSelector value="30d" onChange={() => {}} available={['30d', '1y']} />);
    expect(periodNames()).toEqual(['30d', '1y']);
  });

  it('always keeps the selected period visible', () => {
    render(<PeriodSelector value="7d" onChange={() => {}} available={['30d', '1y']} />);

    expect(periodNames()).toEqual(['7d', '30d', '1y']);
    expect(screen.getByRole('radio', { name: '7 days' })).toBeChecked();
  });
});
