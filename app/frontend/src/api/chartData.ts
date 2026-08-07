// Record IDs are {PREFIX}-{YYYYMMDD}-{seq}. This buckets creation dates into a
// trailing 14-day cumulative-count trace, so the strip chart reflects real
// vault data instead of hardcoded demo numbers.
export function dailyCumulativeCounts(ids: string[], days = 14): number[] {
  const dateStrs = ids
    .map((id) => id?.match(/-(\d{8})-/)?.[1])
    .filter((d): d is string => Boolean(d));

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const buckets: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    buckets.push(
      `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`
    );
  }

  const createdBefore = (bucketDateStr: string) => dateStrs.filter((d) => d <= bucketDateStr).length;

  return buckets.map(createdBefore);
}

// Status lifecycle -> color, shared by every donut so a status reads the same
// color on every record type. Colors reuse the existing CSS custom properties.
export const STATUS_COLORS: { label: string; colorVar: string }[] = [
  { label: 'Draft', colorVar: '--ink-dim' },
  { label: 'In Review', colorVar: '--gold' },
  { label: 'Approved', colorVar: '--teal' },
  { label: 'Obsolete', colorVar: '--navy-dim' },
];

// Count records in each of the 4 status buckets, as DonutChart data. Records
// with an unrecognized/missing status are ignored (donut shows only the
// controlled vocabulary).
export function statusBreakdown(records: { status?: unknown }[]): { label: string; value: number; colorVar: string }[] {
  return STATUS_COLORS.map(({ label, colorVar }) => ({
    label,
    colorVar,
    value: records.filter((r) => r.status === label).length,
  }));
}

// CAP effectiveness funnel stages Pending -> Pass/Fail/N/A, counted from the
// effectiveness_status field. Colors reuse the shared CSS custom properties.
export const EFFECTIVENESS_STAGES: { label: string; colorVar: string }[] = [
  { label: 'Pending', colorVar: '--gold' },
  { label: 'Pass', colorVar: '--teal' },
  { label: 'Fail', colorVar: '--red' },
  { label: 'N/A', colorVar: '--ink-dim' },
];

export function effectivenessFunnel(records: Record<string, unknown>[]): { label: string; value: number; colorVar: string }[] {
  return EFFECTIVENESS_STAGES.map(({ label, colorVar }) => ({
    label,
    colorVar,
    value: records.filter((r) => r.effectiveness_status === label).length,
  }));
}

// Bucket a text/select field into { label, value } counts for a Pareto chart.
// Blank/missing values fold into a single "Unclassified" bucket rather than
// being dropped -- pre-schema records still show up.
export function paretoCounts(records: Record<string, unknown>[], field: string): { label: string; value: number }[] {
  const counts = new Map<string, number>();
  for (const r of records) {
    const raw = r[field];
    const key = typeof raw === 'string' && raw.trim() ? raw.trim() : 'Unclassified';
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts, ([label, value]) => ({ label, value }));
}

// Incident severity levels -> color, for the trend chart's per-severity traces.
export const SEVERITY_COLORS: { label: string; colorVar: string }[] = [
  { label: 'Low', colorVar: '--teal' },
  { label: 'Medium', colorVar: '--gold' },
  { label: 'High', colorVar: '--red' },
  { label: 'Critical', colorVar: '--plum' },
];

// One cumulative-count trace per severity over the trailing `days` window,
// shaped for StripChart. Reuses dailyCumulativeCounts on each severity's ids.
export function dailySeverityTrend(
  records: { id?: string; severity?: unknown }[],
  days = 14
): { label: string; colorVar: string; data: number[] }[] {
  return SEVERITY_COLORS.map(({ label, colorVar }) => ({
    label,
    colorVar,
    data: dailyCumulativeCounts(
      records.filter((r) => r.severity === label).map((r) => r.id ?? ''),
      days
    ),
  }));
}
