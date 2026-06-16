/**
 * Formats a question pool timestamp into a human-readable freshness string.
 *
 * Rules:
 *   < 1 minute  → "Updated just now"
 *   < 60 min    → "Updated Xm ago"
 *   < 24 hours  → "Updated Xh ago"
 *   >= 24 hours → "Updated Mon D"  (e.g. "Updated Apr 9")
 *
 * Returns null when isoString is null or empty.
 */
export function formatFreshness(isoString: string | null): string | null {
  if (!isoString) return null;

  const diffMs = Date.now() - new Date(isoString).getTime();
  const diffMin = Math.floor(diffMs / 60_000);
  const diffHours = Math.floor(diffMs / 3_600_000);

  if (diffMin < 1) return 'Updated just now';
  if (diffMin < 60) return `Updated ${diffMin}m ago`;
  if (diffHours < 24) return `Updated ${diffHours}h ago`;

  const label = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(
    new Date(isoString)
  );
  return `Updated ${label}`;
}
