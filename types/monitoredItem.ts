// types/monitoredItem.ts
export type PriceRecord = {
  date: string; // YYYY-MM-DD
  price: number;
};

export type MonitoredItemDoc = {
  productName: string;
  imageUrl: string;
  price: number;
  capacity?: number;
  outputPower?: number;
  weight?: number;
  hasTypeC?: boolean;
  tags: string[];
  featureHighlights?: string[];
  aiSummary: string;
  priceHistory: PriceRecord[];
  affiliateUrl: string;
  createdAt?: FirebaseFirestore.Timestamp;
  updatedAt?: FirebaseFirestore.Timestamp;
};

// UI で使いやすいように Timestamp を number(ms) に変換した型
export type MonitoredItem = Omit<
  MonitoredItemDoc,
  "createdAt" | "updatedAt"
> & {
  id: string;
  createdAt: number | null;
  updatedAt: number | null;
};
