// types/item.ts
import { Timestamp } from "firebase-admin/firestore";

export type Item = {
  itemName: string;
  itemPrice: number;
  affiliateUrl: string;
  imageUrl: string;
  shopName: string;
  createdAt: Timestamp;
};
