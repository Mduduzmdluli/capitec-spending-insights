import { describe, expect, it } from 'vitest';
import { describeChange } from './describeChange';

describe('describeChange', () => {
  it('reports an increase, rounded to a whole percent', () => {
    expect(describeChange(12.4)).toEqual({ kind: 'up', percent: 12 });
  });

  it('reports a decrease', () => {
    expect(describeChange(-3.2)).toEqual({ kind: 'down', percent: 3 });
  });

  it('treats changes that round to 0% as the same', () => {
    expect(describeChange(0.3)).toEqual({ kind: 'same' });
    expect(describeChange(-0.4)).toEqual({ kind: 'same' });
  });

  it('has nothing to compare against when the API sends no change', () => {
    expect(describeChange(null)).toEqual({ kind: 'none' });
  });
});
