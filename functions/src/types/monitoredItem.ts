export type PriceHistoryEntry = { date: string; price: number };

export type MonitoredItem = {
  productName: string;
  imageUrl: string;
  price: number;
  capacity: number | null;
  outputPower: number | null;
  weight: number | null;
  hasTypeC: boolean;
  tags: string[];
  category: string;
  featureHighlights: string[];
  aiSummary: string;
  priceHistory: PriceHistoryEntry[];
  affiliateUrl: string;
  views: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  // ★ 追加（CVR用）
  inStock: boolean | null;
  reviewAverage: number | null;
  reviewCount: number | null;
};
