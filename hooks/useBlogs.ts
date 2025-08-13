// hooks/useBlogs.ts
import { useState } from "react";
import { fetchBlogsPage } from "@/lib/firestore/blogs";
import type { BlogType } from "@/types";

type UseBlogsProps = {
  initialItems: BlogType[];
  initialCursor?: string;
  auto?: boolean;
  initialQuery?: {
    sort?: "newest" | "popular";
    pageSize?: number;
  };
};

export function useBlogs({
  initialItems,
  initialCursor,
  initialQuery,
}: UseBlogsProps) {
  const [blogs, setBlogs] = useState<BlogType[]>(initialItems);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(!!initialCursor);

  // 🔥 sort を stateに保持（loadMoreにも使うため）
  const sort = initialQuery?.sort ?? "newest";

  const loadMore = async () => {
    if (!cursor || isLoading) return;
    setIsLoading(true);
    try {
      const { items, nextCursor } = await fetchBlogsPage({ cursor, sort }); // 🔥 sortを渡す
      setBlogs((prev) => [...prev, ...items]);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } finally {
      setIsLoading(false);
    }
  };

  return {
    blogs,
    isLoading,
    loadMore,
    hasMore,
  };
}
