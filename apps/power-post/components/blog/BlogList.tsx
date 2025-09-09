// components/blog/BlogList.tsx
import type { BlogClient } from "@/types";
import { BlogCard } from "./BlogCard";

type Props = { items: BlogClient[] };

export function BlogList({ items }: Props) {
  if (items.length === 0) {
    return (
      <div
        className="text-center text-gray-500 py-12 space-y-3"
        role="status"
        aria-live="polite"
      >
        <p>記事がまだありません。</p>
        <a href="/product" className="text-blue-600 hover:underline">
          商品一覧に戻る
        </a>
      </div>
    );
  }

  return (
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((blog) => (
        <BlogCard key={blog.slug} blog={blog} />
      ))}
    </div>
  );
}
