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
