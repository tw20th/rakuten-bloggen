// types/blog.ts
import { Timestamp } from "firebase-admin/firestore";

export type Blog = {
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  relatedItemCode: string;
  createdAt: Timestamp; // Firestore Timestamp
  // 任意で追加:
  // updatedAt?: Timestamp;
  // summary?: string;
};
