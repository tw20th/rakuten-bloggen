"use client";

import { useMemo } from "react";
import { useSearchParams, useRouter } from "next/navigation";
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

// 簡易タグフィルタ（?tag=XXX を操作）
function TagFilter({ all }: { all: string[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const current = sp.get("tag") ?? "";
  const tags = useMemo(() => Array.from(new Set(all)).sort(), [all]);

  const setTag = (t: string) => {
    const p = new URLSearchParams(sp);
    if (t) p.set("tag", t);
    else p.delete("tag");
    router.push(`/blog?${p.toString()}`);
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <button
        onClick={() => setTag("")}
        className={`px-3 py-1 rounded-full border ${
          !current ? "bg-gray-900 text-white" : "hover:bg-gray-100"
        }`}
      >
        すべて
      </button>
      {tags.map((t) => (
        <button
          key={t}
          onClick={() => setTag(t)}
          className={`px-3 py-1 rounded-full border ${
            current === t ? "bg-gray-900 text-white" : "hover:bg-gray-100"
          }`}
        >
          #{t}
        </button>
      ))}
    </div>
  );
}

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

  // 表示用すべてのタグ
  const allTags = useMemo(
    () => Array.from(new Set(blogs.flatMap((b) => b.tags ?? []))),
    [blogs]
  );

  // ?tag= を実際の表示に適用
  const sp = useSearchParams();
  const currentTag = (sp.get("tag") ?? "").trim();
  const filteredBlogs: BlogClient[] = useMemo(() => {
    if (!currentTag) return blogs;
    return blogs.filter((b) => (b.tags ?? []).includes(currentTag));
  }, [blogs, currentTag]);

  return (
    <div className="space-y-6 max-w-5xl mx-auto px-4 py-6">
      {/* セクション内のミニナビ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">読みもの</h1>
        <div className="flex items-center gap-2">
          <a href="/product" className="text-sm text-blue-600 hover:underline">
            商品一覧へ
          </a>
          <a href="/tags" className="text-sm text-blue-600 hover:underline">
            タグ一覧
          </a>
        </div>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SortSelect options={sortOptions} value={sort} onChange={updateSort} />
        {allTags.length > 0 && <TagFilter all={allTags} />}
      </div>

      {/* フィルタ適用後の一覧 */}
      {filteredBlogs.length === 0 && !isLoading ? (
        <div className="text-center text-gray-500 py-12 space-y-3">
          <p>該当する記事が見つかりませんでした。</p>
          <a href="/blog" className="text-blue-600 hover:underline">
            フィルタを解除
          </a>
        </div>
      ) : (
        <BlogList items={filteredBlogs} />
      )}

      <InfiniteScroll
        isLoading={isLoading}
        hasMore={hasMore}
        onLoadMore={loadMore}
      />
    </div>
  );
}
