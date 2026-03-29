/**
 * Convert a Firestore Timestamp, Date, or raw value into a JS Date.
 * Returns null for missing or unparseable values.
 */
export function fromTimestamp(ts: unknown): Date | null {
  if (!ts) return null;
  try {
    if (typeof (ts as { toDate?: unknown }).toDate === "function") {
      return (ts as { toDate: () => Date }).toDate();
    }
    const d = new Date(ts as string | number);
    return isNaN(d.getTime()) ? null : d;
  } catch {
    return null;
  }
}

/**
 * Format a Date as a human-readable relative time string.
 * Handles future dates gracefully ("just now").
 */
export function timeAgo(date: Date): string {
  const diffMs = Date.now() - date.getTime();
  const diffSec = Math.floor(diffMs / 1_000);

  if (diffSec < 60) return "just now";

  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `${diffMin} minute${diffMin === 1 ? "" : "s"} ago`;

  const diffHour = Math.floor(diffMin / 60);
  if (diffHour < 24) return `${diffHour} hour${diffHour === 1 ? "" : "s"} ago`;

  const diffDay = Math.floor(diffHour / 24);
  if (diffDay < 7) return `${diffDay} day${diffDay === 1 ? "" : "s"} ago`;

  const diffWeek = Math.floor(diffDay / 7);
  if (diffWeek < 5) return `${diffWeek} week${diffWeek === 1 ? "" : "s"} ago`;

  const diffMonth = Math.floor(diffDay / 30);
  if (diffMonth < 12) return `${diffMonth} month${diffMonth === 1 ? "" : "s"} ago`;

  const diffYear = Math.floor(diffDay / 365);
  return `${diffYear} year${diffYear === 1 ? "" : "s"} ago`;
}
