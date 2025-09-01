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

// ここに sku を追加（将来的に ASIN ベースの主キーに移行するため）
export type MonitoredItem = {
  sku?: string; // 👈 新規追加
  itemCode?: string; // 👈 既存の互換用として残す

  productName: string;
  imageUrl: string | null;
  price: number | null;
  affiliateUrl: string | null;

  // 集約履歴（UI表示用）
  priceHistory: PriceHistoryEntry[];

  // ✨ V2
  offers?: Offer[];
  specs?: Specs;

  // 互換フィールド（旧UI用：任意）
  capacity?: number | null;
  outputPower?: number | null;
  weight?: number | null;
  hasTypeC?: boolean;
  category?: string;
  aiSummary?: string;

  tags: string[];
  featureHighlights: string[];
  views?: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  // CVR系（任意）
  inStock?: boolean | null;
  reviewAverage?: number | null;
  reviewCount?: number | null;
};

// 共通で使う型を定義
export type Sku = string;
export type Source = "rakuten" | "amazon" | "yahoo";
