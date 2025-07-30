// app/hooks/useFilteredBlogs.ts
"use client";

import { useSearchParams } from "next/navigation";
import { BlogType } from "@/types/blog";

export function useFilteredBlogs(blogs: BlogType[]) {
  const searchParams = useSearchParams();

  const sortParam = searchParams.get("sort");
  const tag = searchParams.get("tag");

  const sort: "newest" | "popular" =
    sortParam === "popular" ? "popular" : "newest";

  const sorted = [...blogs].sort((a, b) => {
    if (sort === "popular") {
      return (b.views || 0) - (a.views || 0);
    } else {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
  });

  const filtered = tag
    ? sorted.filter((blog) => blog.tags?.includes(tag))
    : sorted;

  return {
    filteredBlogs: filtered,
    sort,
    tag,
  };
}
