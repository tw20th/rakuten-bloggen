// utils/offers.ts
import type { Offer } from "@/types/monitoredItem";

const PRIORITY: Record<Offer["source"], number> = {
  amazon: 0,
  rakuten: 1,
  yahoo: 2,
};

export const primaryOffer = (offers?: Offer[] | null): Offer | null => {
  if (!Array.isArray(offers) || offers.length === 0) return null;
  return (
    [...offers].sort(
      (a, b) =>
        PRIORITY[a.source] - PRIORITY[b.source] ||
        new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
    )[0] ?? null
  );
};

export const minPriceOffer = (offers?: Offer[] | null): Offer | null => {
  if (!Array.isArray(offers) || offers.length === 0) return null;
  return [...offers].sort((a, b) => a.price - b.price)[0] ?? null;
};

export const offerBySource = (
  offers: Offer[] | undefined,
  source: Offer["source"]
) => (offers ?? []).find((o) => o.source === source) ?? null;

export const affiliateHost = (url?: string | null): string | undefined => {
  if (!url) return;
  try {
    const host = new URL(url).hostname;
    if (host.includes("rakuten")) return "rakuten";
    if (host.includes("amazon")) return "amazon";
    if (host.includes("shopping.yahoo")) return "yahoo";
    return host;
  } catch {
    return;
  }
};
