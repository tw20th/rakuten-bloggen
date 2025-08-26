// hooks/useBlogs.ts
"use client";

import { useState } from "react";
import type { BlogClient } from "@/types";

type UseBlogsProps = {
  initialItems: BlogClient[];
  initialCursor?: string;
  initialQuery?: {
    sort?: "newest" | "popular" | "oldest";
    pageSize?: number;
    tag?: string;
  };
};

async function fetchBlogsViaApi(params: {
  cursor?: string;
  sort: "newest" | "popular" | "oldest";
  pageSize?: number;
  tag?: string;
}) {
  const qs = new URLSearchParams();
  if (params.cursor) qs.set("cursor", params.cursor);
  qs.set("sort", params.sort);
  if (params.pageSize) qs.set("pageSize", String(params.pageSize));
  if (params.tag) qs.set("tag", params.tag);

  const res = await fetch(`/api/blogs?${qs.toString()}`, {
    method: "GET",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`Failed to fetch blogs: ${res.status}`);
  return (await res.json()) as {
    items: BlogClient[];
    nextCursor?: string | null;
  };
}

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
  const pageSize = initialQuery?.pageSize ?? 20;
  const tag = initialQuery?.tag;

  const loadMore = async () => {
    if (!hasMore || isLoading) return;
    setIsLoading(true);
    try {
      const { items, nextCursor } = await fetchBlogsViaApi({
        cursor,
        sort,
        pageSize,
        tag,
      });
      setBlogs((prev) => [...prev, ...items]);
      setCursor(nextCursor ?? undefined);
      setHasMore(!!nextCursor);
    } finally {
      setIsLoading(false);
    }
  };

  return { blogs, isLoading, loadMore, hasMore };
}
