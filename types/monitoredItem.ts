export type PriceHistoryEntry = {
  date: string; // ISO形式で保存されている
  price: number;
};

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
};
export type MonitoredItemClient = Omit<
  MonitoredItem,
  "createdAt" | "updatedAt"
> & {
  createdAt: string;
  updatedAt: string;
};
