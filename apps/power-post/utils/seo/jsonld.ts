import type { Offer, MonitoredItemLite } from "@/types/seo";

export const buildProductJsonLd = (
  item: MonitoredItemLite,
  offers: Offer[]
) => {
  const base: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: item.productName,
    image: [item.imageUrl],
    brand: item.brand ? { "@type": "Brand", name: item.brand } : undefined,
    sku: item.sku,
    description: item.description,
  };

  if (offers.length <= 1) {
    const o = offers[0];
    return {
      ...base,
      offers: {
        "@type": "Offer",
        price: o.price,
        priceCurrency: o.priceCurrency,
        availability: o.availability,
        url: o.url,
        seller: { "@type": "Organization", name: o.seller },
      },
      aggregateRating: item.aggregateRating
        ? { "@type": "AggregateRating", ...item.aggregateRating }
        : undefined,
    };
  }

  // 将来：Amazon/Yahoo 追加時に自動で AggregateOffer に切替
  const prices = offers.map((o) => o.price);
  return {
    ...base,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "JPY",
      lowPrice: Math.min(...prices),
      highPrice: Math.max(...prices),
      offerCount: offers.length,
      offers: offers.map((o) => ({
        "@type": "Offer",
        price: o.price,
        priceCurrency: o.priceCurrency,
        availability: o.availability,
        url: o.url,
        seller: { "@type": "Organization", name: o.seller },
      })),
    },
    aggregateRating: item.aggregateRating
      ? { "@type": "AggregateRating", ...item.aggregateRating }
      : undefined,
  };
};
