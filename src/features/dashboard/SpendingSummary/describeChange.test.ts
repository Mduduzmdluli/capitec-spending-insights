import { describe, expect, it } from 'vitest';
import { describeChange } from './describeChange';

describe('describeChange', () => {
  it('reports an increase', () => {
    expect(describeChange(11200, 10000)).toEqual({ kind: 'up', percent: 12 });
  });

  it('reports a decrease', () => {
    expect(describeChange(8800, 10000)).toEqual({ kind: 'down', percent: 12 });
  });

  it('treats changes that round to 0% as the same', () => {
    expect(describeChange(10040, 10000)).toEqual({ kind: 'same' });
  });

  it('has nothing to compare against when the previous period is empty', () => {
    expect(describeChange(5000, 0)).toEqual({ kind: 'none' });
  });
});
