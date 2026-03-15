/**
 * Format ISO date string the same on server and client to avoid hydration mismatch.
 * Do not use toLocaleDateString() in SSR-rendered content.
 */
export function formatDate(isoDateString: string): string {
  const d = new Date(isoDateString);
  const day = d.getUTCDate();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
  ];
  const month = months[d.getUTCMonth()];
  const year = d.getUTCFullYear();
  return `${day} ${month} ${year}`;
}
