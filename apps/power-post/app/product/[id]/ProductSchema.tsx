"use client";
import { buildProductJsonLd } from "@/utils/seo/jsonld";
import type { MonitoredItemLite, Offer } from "@/types/seo";

type Props = {
  item: MonitoredItemLite;
  rakutenUrl: string;
  price: number;
  inStock: boolean;
};

export default function ProductSchema({
  item,
  rakutenUrl,
  price,
  inStock,
}: Props) {
  const offers: Offer[] = [
    {
      price,
      priceCurrency: "JPY",
      availability: inStock
        ? "http://schema.org/InStock"
        : "http://schema.org/OutOfStock",
      url: rakutenUrl,
      seller: "Rakuten",
    },
  ];
  const json = buildProductJsonLd(item, offers);
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(json) }}
    />
  );
}
