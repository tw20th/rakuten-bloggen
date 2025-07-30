// hooks/useBlogs.ts
import { useState } from "react";
import { fetchBlogsPage } from "@/lib/firestore/blogs";
import type { BlogType } from "@/types";

type BlogQuery = {
  sort?: "newest" | "popular";
  tag?: string;
  pageSize?: number;
};

type UseBlogsProps = {
  initialItems: BlogType[];
  initialCursor?: string;
  initialQuery?: BlogQuery;
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
  const [query] = useState<BlogQuery>(initialQuery || {});

  const loadMore = async () => {
    if (!cursor || isLoading) return;
    setIsLoading(true);
    try {
      const { items, nextCursor } = await fetchBlogsPage({ cursor, query });
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
