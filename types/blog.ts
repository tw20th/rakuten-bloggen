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
};

export type BlogClient = Omit<Blog, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};

// 既存コード互換（BlogType をクライアント型として扱う）
export type BlogType = BlogClient;
