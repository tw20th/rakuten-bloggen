// types/blog.ts

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

// クライアントで使う場合（任意）
export type BlogClient = Omit<Blog, "createdAt" | "updatedAt"> & {
  createdAt: string;
  updatedAt: string;
};
