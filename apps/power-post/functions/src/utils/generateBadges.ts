import type { MonitoredItem } from "../types/monitoredItem";

export function generateBadges(item: MonitoredItem): string[] {
  const b: string[] = [];
  if (item.inStock === true) b.push("✅ 在庫あり");
  if (item.inStock === false) b.push("⛔ 在庫なし");

  const h = item.priceHistory;
  if (h.length >= 2) {
    const prev = h[h.length - 2]?.price;
    const curr = h[h.length - 1]?.price;
    if (typeof prev === "number" && typeof curr === "number" && curr < prev)
      b.push("🔥 値下げ中");
  }

  if (
    typeof item.reviewAverage === "number" &&
    typeof item.reviewCount === "number" &&
    item.reviewAverage >= 4.0 &&
    item.reviewCount >= 50
  )
    b.push("⭐️ 高評価");

  return b;
}
