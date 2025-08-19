// utils/badges.ts
export type PricePoint = { price: number; date: string };

export type Badge =
  | { type: "price-drop"; label: string }
  | { type: "lowest-update"; label: string }
  | { type: "restock"; label: string };

type Params = {
  currentPrice?: number | null;
  history?: PricePoint[];
  wasOutOfStock?: boolean;
  isInStock?: boolean;
  dropPercentThreshold?: number; // 既定 5%
  dropAmountThreshold?: number; // 既定 500円
};

export function computeBadges({
  currentPrice,
  history = [],
  wasOutOfStock,
  isInStock,
  dropPercentThreshold = 5,
  dropAmountThreshold = 500,
}: Params): Badge[] {
  const badges: Badge[] = [];
  if (typeof currentPrice !== "number") return badges;

  const sorted = [...history].sort((a, b) => a.date.localeCompare(b.date));
  const prev = sorted.length ? sorted[sorted.length - 1] : undefined;
  const minPast = sorted.length
    ? Math.min(...sorted.map((h) => h.price))
    : currentPrice;

  // 値下げ
  if (prev) {
    const diff = prev.price - currentPrice;
    const percent = (diff / prev.price) * 100;
    if (diff >= dropAmountThreshold || percent >= dropPercentThreshold) {
      badges.push({
        type: "price-drop",
        label: `値下げ ${Math.round(percent)}%`,
      });
    }
  }

  // 最安更新
  if (currentPrice <= Math.min(minPast, currentPrice)) {
    badges.push({ type: "lowest-update", label: "最安値更新" });
  }

  // 在庫復活
  if (wasOutOfStock && isInStock) {
    badges.push({ type: "restock", label: "在庫復活" });
  }

  return badges;
}
