// app/blog/BlogPageClient.tsx
"use client";

import { useBlogs } from "@/hooks/useBlogs";
import { BlogFilter } from "@/components/blog/BlogFilter";
import { BlogList } from "@/components/blog/BlogList";
import type { BlogType } from "@/types";

type Props = {
  initialItems: BlogType[];
  initialCursor?: string;
  sort: "newest" | "popular";
  tag?: string;
};

export default function BlogPageClient({
  initialItems,
  initialCursor,
  sort,
  tag,
}: Props) {
  const { blogs, loadMore, hasMore, isLoading } = useBlogs({
    initialItems,
    initialCursor,
    initialQuery: { sort, tag },
  });

  return (
    <main className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">ブログ一覧</h1>

      <div className="space-y-4">
        <BlogFilter currentSort={sort} currentTag={tag} />
        <BlogList blogs={blogs} />
        {hasMore && (
          <div className="text-center">
            <button
              onClick={loadMore}
              disabled={isLoading}
              className="mt-4 px-4 py-2 bg-gray-200 rounded"
            >
              {isLoading ? "読み込み中..." : "もっと見る"}
            </button>
          </div>
        )}
      </div>
    </main>
  );
}
