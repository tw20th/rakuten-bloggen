"use client";

import { useBlogs } from "@/hooks/useBlogs";
import { BlogList } from "@/components/blog/BlogList";
import type { BlogClient } from "@/types";
import { SortSelect } from "@/components/common/SortSelect";
import { useSortQuery } from "@/hooks/useSortQuery";
import { InfiniteScroll } from "@/components/common/InfiniteScroll";

type Props = {
  initialItems: BlogClient[];
  initialCursor?: string;
  initialSort: "popular" | "newest" | "oldest";
};

const sortOptions = [
  { label: "新着順", value: "newest" },
  { label: "人気順", value: "popular" },
];

export function BlogPageClient({
  initialItems,
  initialCursor,
  initialSort,
}: Props) {
  const { currentSort, updateSort } = useSortQuery();
  const sort = (currentSort as "newest" | "popular" | "oldest") ?? initialSort;

  const { blogs, isLoading, hasMore, loadMore } = useBlogs({
    initialItems,
    initialCursor,
    initialQuery: { sort, pageSize: 10 },
  });

  return (
    <div className="space-y-8 max-w-5xl mx-auto px-4 py-8">
      <SortSelect options={sortOptions} value={sort} onChange={updateSort} />
      <BlogList items={blogs} />
      <InfiniteScroll
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
