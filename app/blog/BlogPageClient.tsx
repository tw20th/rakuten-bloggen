// app/blog/BlogPageClient.tsx
"use client";

import { useEffect, useRef } from "react";
import { useBlogs } from "@/hooks/useBlogs";
import { BlogList } from "@/components/blog/BlogList";
import type { BlogType } from "@/types";

type Props = {
  initialItems: BlogType[];
  initialCursor?: string;
};

export function BlogPageClient({ initialItems, initialCursor }: Props) {
  const { blogs, isLoading, hasMore, loadMore } = useBlogs({
    initialItems,
    initialCursor,
    auto: true, // 無限スクロールを有効化
    initialQuery: {
      sort: "newest",
      pageSize: 10,
    },
  });

  // hook ではなく、このコンポーネント側で sentinelRef を用意
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sentinelRef.current) return;
    if (!hasMore) return;

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting && !isLoading) {
          void loadMore();
        }
      },
      { rootMargin: "200px 0px" }
    );

    io.observe(sentinelRef.current);
    return () => io.disconnect();
  }, [hasMore, isLoading, loadMore]);

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">
      <BlogList items={blogs} />

      {hasMore && (
        <div
          ref={sentinelRef}
          className="h-12 w-full flex items-center justify-center"
        >
          {isLoading ? (
            <span className="text-gray-500 text-sm">読み込み中…</span>
          ) : (
            <span className="text-gray-400 text-sm">
              スクロールでさらに表示
            </span>
          )}
        </div>
      )}
    </div>
  );
}
