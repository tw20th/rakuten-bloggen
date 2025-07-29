// types/blog.ts

export type AnalysisResult = {
  score: number; // SEOや構造に対するスコア（0〜100）
  suggestions: string[]; // 改善提案リスト
  createdAt: string; // 分析日時（ISO文字列）
  summary?: string; // 要約 or 評価コメント（任意）
};

// types/blog.ts
export type BlogType = {
  slug: string; // ← BlogCard 側が必要としてる
  title: string;
  content: string;
  aiSummary: string;
  imageUrl: string;
  tags: string[];
  category: string;
  views: number;
  productId: string;
  createdAt: Date | string;
  updatedAt: Date | string;
  status: "draft" | "published";
  analysisHistory: AnalysisResult[];
  relatedItemCode: string; // ← 追加
  summary?: string; // ← これを追加
};
