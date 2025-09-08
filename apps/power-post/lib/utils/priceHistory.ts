// lib/utils/priceHistory.ts
type FirestoreTimestampLike = { toDate: () => Date };

function hasToDate(v: unknown): v is FirestoreTimestampLike {
  if (typeof v !== "object" || v === null) return false;
  if (!("toDate" in v)) return false;
  const maybe = v as { toDate: unknown };
  return typeof maybe.toDate === "function";
}

export function mapPriceHistoryToISO(
  history: Array<{
    date: string | Date | FirestoreTimestampLike;
    price: number;
  }>
): { date: string; price: number }[] {
  return (history ?? []).map((h) => {
    let iso = "";
    if (typeof h.date === "string") {
      iso = h.date;
    } else if (h.date instanceof Date) {
      iso = h.date.toISOString();
    } else if (hasToDate(h.date)) {
      iso = h.date.toDate().toISOString();
    }
    return { date: iso, price: h.price };
  });
}
