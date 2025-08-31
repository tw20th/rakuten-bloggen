export type Offer = {
  price: number;
  priceCurrency: "JPY";
  availability: "http://schema.org/InStock" | "http://schema.org/OutOfStock";
  url: string;
  seller: string; // "Rakuten" など
};

export type MonitoredItemLite = {
  id: string;
  productName: string;
  imageUrl: string;
  brand?: string;
  sku?: string; // 型番/JANなど
  description?: string;
  aggregateRating?: { ratingValue: number; reviewCount: number };
};
