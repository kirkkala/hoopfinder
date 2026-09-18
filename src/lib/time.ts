export function formatFetchedAt(iso: string, dateOnly = false): string {
  return new Intl.DateTimeFormat("fi-FI", {
    timeZone: "Europe/Helsinki",
    day: "numeric",
    month: "numeric",
    year: "numeric",
    ...(dateOnly
      ? {}
      : { hour: "2-digit", minute: "2-digit", hour12: false }),
  }).format(new Date(iso));
}
