// types/monitoredItem.ts  ← UI側（app が import するやつ）

export type PriceHistoryEntry = {
  date: string; // ISO
  price: number;
};

export type OfferSource = "rakuten" | "amazon" | "yahoo";

export type Offer = {
  source: OfferSource;
  price: number;
  url: string;
  fetchedAt: string; // ISO
  inStock?: boolean | null; // 不明は null/undefined
};

export type MonitoredItem = {
  // 将来の主キー移行用
  sku?: string; // ASIN または itemCode
  itemCode?: string; // 互換

  productName: string;
  imageUrl: string;
  price: number; // 旧互換（UI移行中は残す）
  affiliateUrl: string; // 旧互換（UI移行中は残す）

  // V2
  offers?: Offer[]; // 👈 これを追加

  // 互換（旧UI用）
  capacity: number | null;
  outputPower: number | null;
  weight: number | null;
  hasTypeC: boolean;
  tags: string[];
  category: string;
  featureHighlights: string[];
  aiSummary: string;

  // 履歴・メタ
  priceHistory: PriceHistoryEntry[];
  views: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  // 任意
  inStock?: boolean | null;
  reviewAverage?: number | null;
  reviewCount?: number | null;
};

// クライアント変換用（必要なら）
export type MonitoredItemClient = Omit<
  MonitoredItem,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};
