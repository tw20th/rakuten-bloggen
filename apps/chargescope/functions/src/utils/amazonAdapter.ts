import type { Offer } from "../types/monitoredItem";
import type { PaapiItem } from "./paapi";

const withTag = (u: string, tag: string): string => {
  try {
    const url = new URL(u);
    url.searchParams.set("tag", tag);
    return url.toString();
  } catch {
    return u;
  }
};

export function paapiToOffer(item: PaapiItem, associateTag: string): Offer {
  const url = item.DetailPageURL
    ? withTag(item.DetailPageURL, associateTag)
    : `https://www.amazon.co.jp/dp/${item.ASIN}?tag=${associateTag}`;
  const price = typeof item.Price === "number" ? item.Price : 0;
  const inStock = item.Availability
    ? !/在庫切れ|Out of Stock/i.test(item.Availability)
    : undefined;

  return {
    source: "amazon",
    price,
    url,
    fetchedAt: new Date().toISOString(),
    inStock,
  };
}
