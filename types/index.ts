// types/index.ts

export type { BlogType } from "./blog";

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
