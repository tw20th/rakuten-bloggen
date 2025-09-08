export type PricePoint = {
  source: "rakuten" | "amazon" | "yahoo";
  price: number;
  date: string; // ISO
  url?: string;
};

export type CatalogSpecs = {
  capacity?: number;
  outputPower?: number;
  weight?: number;
  hasTypeC?: boolean;
  [k: string]: unknown;
};

export type CatalogItem = {
  id: string; // 自動生成 (型番/JANベース推奨)
  productName: string;
  brand?: string;
  imageUrl?: string;
  category?: string;
  specs?: CatalogSpecs;
  featureHighlights?: string[];
  tags?: string[];
  aiSummary?: string;
  affiliate?: {
    rakutenUrl?: string;
    amazonUrl?: string;
    yahooUrl?: string;
  };
  priceHistory: PricePoint[];
  scores?: {
    popularity?: number;
    marginPotential?: number;
    seoPotential?: number;
  };
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};
