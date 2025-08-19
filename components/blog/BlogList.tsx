import type { BlogClient } from "@/types";
import { BlogCard } from "./BlogCard";

type Props = { items: BlogClient[] };

// 「人気の読みもの」安全表示をページ側でやる場合はここはシンプルでOK
export function BlogList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12 space-y-3">
        <p>記事がまだありません。</p>
        <a href="/product" className="text-blue-600 hover:underline">
          商品一覧に戻る
        </a>
      </div>
    );
  }

  // ?tag= によるフィルタは BlogPageClient 側で行っている想定
  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((blog) => (
        <BlogCard key={blog.slug} blog={blog} />
      ))}
    </div>
  );
}
