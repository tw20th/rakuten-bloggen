// types/product.ts 置き換え（互換を残しつつ明確化）
export type PriceHistoryEntry = {
  date: string; // クライアントでは ISO 文字列
  price: number;
};

export type ProductType = {
  id: string;
  productName: string;
  imageUrl: string;

  /** 一次フィールド。UIもDBも基本こちら */
  price: number;

  /** 旧フィールド（受け取り時だけ読む）。新規書き込み禁止 */
  itemPrice?: number;

  // 追加で使う可能性のある任意情報
  brand?: string;

  // specs
  capacity?: number;
  outputPower?: number;
  weight?: number;
  hasTypeC?: boolean;

  // taxonomy
  tags: string[];
  category: string;
  featureHighlights?: string[];
  aiSummary?: string;

  // metrics
  views: number;
  priceHistory: PriceHistoryEntry[];
  affiliateUrl: string;

  // meta
  createdAt: string;
  updatedAt: string;

  inStock?: boolean | null;
  reviewAverage?: number | null;
  reviewCount?: number | null;
};
