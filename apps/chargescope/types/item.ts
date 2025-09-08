import { Timestamp } from "firebase-admin/firestore"; // Admin SDK 使用時

export type PriceHistoryEntry = {
  date: Timestamp | string;
  price: number;
};

export type Item = {
  itemName: string;
  itemPrice: number;
  affiliateUrl: string;
  imageUrl: string;
  shopName: string;
  price: number;

  // Optional fields
  displayName?: string;
  description?: string;
  capacity?: number;
  outputPower?: number;
  hasTypeC?: boolean;

  // 日付系：Serverでは Timestamp、Clientには string
  createdAt: Timestamp | string;
  updatedAt?: Timestamp | string;

  // 配列型にも Timestamp 含む場合があるので対応
  priceHistory?: PriceHistoryEntry[];
};
