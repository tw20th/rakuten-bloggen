// utils/badges.ts
export type PricePoint = { price: number; date: string };

export type Badge =
  | { type: "price-drop"; label: string }
  | { type: "lowest-update"; label: string }
  | { type: "restock"; label: string }
  | { type: "high-rating"; label: string }; // ★ 追加

type Params = {
  currentPrice?: number | null;
  history?: PricePoint[];

  // 在庫
  inStock?: boolean | null;
  prevInStock?: boolean | null;
  isInStock?: boolean;
  wasOutOfStock?: boolean;

  // レビュー
  reviewAverage?: number | null;
  reviewCount?: number | null;

  // 値下げ閾値
  dropPercentThreshold?: number;
  dropAmountThreshold?: number;
};

export function computeBadges({
  currentPrice,
  history = [],

  inStock,
  prevInStock,
  isInStock,
  wasOutOfStock,

  reviewAverage,
  reviewCount,

  dropPercentThreshold = 5,
  dropAmountThreshold = 500,
}: Params): Badge[] {
  const badges: Badge[] = [];
  if (typeof currentPrice !== "number") return badges;

  // --- 在庫フラグ ---
  const nowInStock =
    typeof inStock === "boolean"
      ? inStock
      : typeof isInStock === "boolean"
      ? isInStock
      : undefined;

  const previouslyOut =
    typeof prevInStock === "boolean"
      ? prevInStock === false
      : typeof wasOutOfStock === "boolean"
      ? wasOutOfStock
      : undefined;

  // --- 価格履歴 ---
  const sorted = [...history].sort((a, b) =>
    String(a.date).localeCompare(String(b.date))
  );
  const prev = sorted.length ? sorted[sorted.length - 1] : undefined;
  const hasHistory = sorted.length > 0;
  const minPast = hasHistory
    ? Math.min(...sorted.map((h) => h.price))
    : Infinity;

  // --- 値下げ ---
  if (prev && prev.price > 0) {
    const diff = prev.price - currentPrice;
    const percent = (diff / prev.price) * 100;
    if (
      diff > 0 &&
      (diff >= dropAmountThreshold || percent >= dropPercentThreshold)
    ) {
      badges.push({
        type: "price-drop",
        label: `値下げ ${Math.round(percent)}%`,
      });
    }
  }

  // --- 最安更新 ---
  if (hasHistory && currentPrice < minPast) {
    badges.push({ type: "lowest-update", label: "最安値更新" });
  }

  // --- 在庫復活 ---
  if (previouslyOut === true && nowInStock === true) {
    badges.push({ type: "restock", label: "在庫復活" });
  }

  // --- 高評価 ---
  if (
    typeof reviewAverage === "number" &&
    typeof reviewCount === "number" &&
    reviewAverage >= 4.0 &&
    reviewCount >= 50
  ) {
    badges.push({ type: "high-rating", label: "⭐️ 高評価" });
  }

  return badges;
}
