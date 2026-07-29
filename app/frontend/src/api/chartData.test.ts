import { describe, it, expect } from 'vitest';
import { dailyCumulativeCounts } from './chartData';

describe('dailyCumulativeCounts', () => {
  it('returns a trailing cumulative count trace with today\'s total as the last point', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const ids = [`CAP-${todayStr}-001`, `CAP-${todayStr}-002`];

    const series = dailyCumulativeCounts(ids, 14);

    expect(series).toHaveLength(14);
    expect(series[13]).toBe(2);
    expect(series[0]).toBe(0);
  });

  it('ignores malformed ids', () => {
    const series = dailyCumulativeCounts(['not-an-id'], 14);
    expect(series.every((v) => v === 0)).toBe(true);
  });
});
