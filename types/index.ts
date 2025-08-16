// types/index.ts

export type { Blog as BlogType } from "./blog";
export type { Blog, BlogClient } from "./blog";

export type { TSOrString } from "./firestore";
export { isTimestamp, tsToISOString } from "./firestore";

export type PriceHistoryEntry = {
  date: string;
  price: number;
};

export type MonitoredItemType = {
  productName: string;
  imageUrl: string;
  price: number;
  capacity?: number;
  outputPower?: number;
  weight?: number;
  hasTypeC?: boolean;
  tags: string[];
  category: string;
  views: number;
  featureHighlights?: string[];
  aiSummary: string;
  priceHistory: PriceHistoryEntry[];
  affiliateUrl: string;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;
};

export type AnalysisResult = {
  score: number;
  suggestions: string[];
  updatedAt: string;
};
