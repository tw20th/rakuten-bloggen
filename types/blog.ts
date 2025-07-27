// types/blog.ts

import { Timestamp } from "firebase-admin/firestore";

// サーバーサイド用（Firestoreから取得時）
export type Blog = {
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  relatedItemCode: string;
  createdAt: Timestamp;
};

// クライアントサイド用（画面表示時）
export type BlogClient = {
  slug: string;
  title: string;
  content: string;
  status: "draft" | "published";
  relatedItemCode: string;
  createdAt: string; // ← ISO文字列
};
