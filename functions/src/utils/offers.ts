import type { Offer, Source } from "../types/monitoredItem";

export const primaryOffer = (offers: Offer[] | undefined): Offer | null => {
  if (!offers || offers.length === 0) return null;
  // ルール：Amazon > Rakuten > Yahoo、同sourceなら最新 fetchedAt を優先
  const priority: Source[] = ["amazon", "rakuten", "yahoo"];
  const sorted = [...offers].sort((a, b) => {
    const p = priority.indexOf(a.source) - priority.indexOf(b.source);
    if (p !== 0) return p;
    return new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime();
  });
  return sorted[0] ?? null;
};

export const minPriceOffer = (offers: Offer[] | undefined): Offer | null => {
  if (!offers || offers.length === 0) return null;
  return [...offers].sort((a, b) => a.price - b.price)[0] ?? null;
};
