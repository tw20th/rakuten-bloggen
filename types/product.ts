// types/product.ts

export type PriceHistoryEntry = {
  date: string; // ISO文字列 or 'YYYY-MM-DD'
  price: number;
};

export type ProductType = {
  id: string; // ← これを追加
  productName: string;
  imageUrl: string;
  price: number;
  itemPrice?: number; // 👈 これを追加！

  // スペック（未抽出時は undefined）
  capacity?: number;
  outputPower?: number;
  weight?: number;
  hasTypeC?: boolean;

  // 分類・特徴
  tags: string[];
  category: string;
  featureHighlights?: string[];
  aiSummary?: string;

  // 表示情報
  views: number;
  priceHistory: PriceHistoryEntry[];
  affiliateUrl: string;

  // 管理用
  createdAt: string; // ISO文字列または Timestamp → string に統一
  updatedAt: string;
};
