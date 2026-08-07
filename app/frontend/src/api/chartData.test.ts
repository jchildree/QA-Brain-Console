import { describe, it, expect } from 'vitest';
import { dailyCumulativeCounts, statusBreakdown, paretoCounts, dailySeverityTrend } from './chartData';

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

describe('statusBreakdown', () => {
  it('counts records into the 4 lifecycle buckets, ignoring unknown status', () => {
    const records = [
      { status: 'Draft' },
      { status: 'Draft' },
      { status: 'Approved' },
      { status: 'Bogus' },
      {},
    ];
    const result = statusBreakdown(records);
    expect(result).toHaveLength(4);
    expect(result.find((r) => r.label === 'Draft')?.value).toBe(2);
    expect(result.find((r) => r.label === 'Approved')?.value).toBe(1);
    expect(result.find((r) => r.label === 'Obsolete')?.value).toBe(0);
  });
});

describe('paretoCounts', () => {
  it('counts a field and folds blank/missing into Unclassified', () => {
    const records = [
      { root_cause: 'Human error' },
      { root_cause: 'Human error' },
      { root_cause: 'Equipment' },
      { root_cause: '' },
      {},
    ];
    const result = paretoCounts(records, 'root_cause');
    expect(result.find((r) => r.label === 'Human error')?.value).toBe(2);
    expect(result.find((r) => r.label === 'Equipment')?.value).toBe(1);
    expect(result.find((r) => r.label === 'Unclassified')?.value).toBe(2);
  });
});

describe('dailySeverityTrend', () => {
  it('returns one cumulative trace per severity level', () => {
    const today = new Date();
    const todayStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const records = [
      { id: `INC-${todayStr}-001`, severity: 'High' },
      { id: `INC-${todayStr}-002`, severity: 'High' },
      { id: `INC-${todayStr}-003`, severity: 'Low' },
    ];
    const series = dailySeverityTrend(records, 14);
    expect(series).toHaveLength(4);
    expect(series.find((s) => s.label === 'High')?.data[13]).toBe(2);
    expect(series.find((s) => s.label === 'Low')?.data[13]).toBe(1);
    expect(series.find((s) => s.label === 'Critical')?.data[13]).toBe(0);
  });
});
