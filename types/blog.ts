// /types/blog.ts
export type Blog = {
  title: string;
  content: string;
  category: string;
  tags: string[];
  slug: string;
  imageUrl: string;
  relatedItemCode: string;
  status: "draft" | "published";
  views: number;
  createdAt: FirebaseFirestore.Timestamp;
  updatedAt: FirebaseFirestore.Timestamp;

  // 追加分（P0用）
  imageUrlOG?: string;
  jsonLd?: Array<Record<string, unknown>>;
  ab?: { titleCandidates?: string[]; currentIndex?: number };
  score?: number;

  // ★ サムネ自動生成で使うフィールド（今回追加）
  heroImageUrl?: string;
  heroCaption?: string;
};

// クライアント表示用（ISO化）
export type BlogClient = Omit<Blog, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// 既存互換
export type BlogType = BlogClient;
