// lib/utils/formatPrice.ts
export const formatPrice = (n: number): string =>
  n.toLocaleString("ja-JP", { style: "currency", currency: "JPY" });
