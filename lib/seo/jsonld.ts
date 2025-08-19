import type { ProductType } from "@/types/product";

export type SimpleOffer = {
  price: number;
  url: string;
  inStock?: boolean;
};

type HasBrand = { brand?: string | null };

export const productJsonLd = (
  p: (ProductType & HasBrand) & { offers?: SimpleOffer[] | undefined }
) => {
  const availability = (o?: SimpleOffer) =>
    o?.inStock === false
      ? "http://schema.org/OutOfStock"
      : "http://schema.org/InStock";

  const offers =
    (p.offers ?? [])
      .filter((o) => typeof o.price === "number" && !!o.url)
      .map((o) => ({
        "@type": "Offer",
        priceCurrency: "JPY",
        price: o.price,
        availability: availability(o),
        url: o.url,
      })) ?? [];

  const offersBlock =
    offers.length > 1
      ? {
          "@type": "AggregateOffer",
          priceCurrency: "JPY",
          lowPrice: Math.min(...offers.map((o) => Number(o.price))),
          highPrice: Math.max(...offers.map((o) => Number(o.price))),
          offerCount: offers.length,
          offers,
        }
      : offers.length === 1
      ? offers[0]
      : undefined;

  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: p.productName,
    image: p.imageUrl ? [p.imageUrl] : undefined,
    brand: p.brand ?? undefined,
    description: p.aiSummary ?? undefined,
    offers: offersBlock,
  };
};
