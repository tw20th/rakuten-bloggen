import { useState } from "react";
import { fetchBlogsPage } from "@/lib/firestore/blogsClient";
import type { BlogClient } from "@/types";

type UseBlogsProps = {
  initialItems: BlogClient[];
  initialCursor?: string;
  initialQuery?: {
    sort?: "newest" | "popular" | "oldest";
    pageSize?: number;
  };
};

export function useBlogs({
  initialItems,
  initialCursor,
  initialQuery,
}: UseBlogsProps) {
  const [blogs, setBlogs] = useState<BlogClient[]>(initialItems);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState<boolean>(!!initialCursor);

  const sort = initialQuery?.sort ?? "newest";

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { items, nextCursor } = await fetchBlogsPage({
        cursor,
        sort,
        pageSize: initialQuery?.pageSize ?? 20,
      });
      setBlogs((prev) => [...prev, ...items]);
      setCursor(nextCursor);
      setHasMore(!!nextCursor);
    } finally {
      setIsLoading(false);
    }
  };

  return { blogs, isLoading, loadMore, hasMore };
}
