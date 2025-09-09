export type PriceHistoryEntry = { date: string; price: number };

export type Offer = {
  source: "rakuten" | "amazon" | "yahoo";
  price: number;
  url: string;
  fetchedAt: string; // ISO
  inStock?: boolean;
};

export type Specs = {
  capacity?: number | null;
  outputPower?: number | null;
  weight?: number | null;
  hasTypeC?: boolean;
  [k: string]: unknown;
};

/** 👇 これを追加 */
export type Category = "battery" | "cable" | "adapter" | "other";

// ここに sku を追加（将来的に ASIN ベースの主キーに移行するため）
export type MonitoredItem = {
  sku?: string;
  itemCode?: string;

  productName: string;
  imageUrl: string | null;
  price: number | null;
  affiliateUrl: string | null;

  priceHistory: PriceHistoryEntry[];

  offers?: Offer[];
  specs?: Specs;

  capacity?: number | null;
  outputPower?: number | null;
  weight?: number | null;
  hasTypeC?: boolean;

  /** 👇 string ではなく Category を使う */
  category?: Category;
  aiSummary?: string;

  tags: string[];
  featureHighlights: string[];
  views?: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  inStock?: boolean | null;
  reviewAverage?: number | null;
  reviewCount?: number | null;
};

export type Sku = string;
export type Source = "rakuten" | "amazon" | "yahoo";
