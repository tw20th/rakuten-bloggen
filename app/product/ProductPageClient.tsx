"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useSortQuery } from "@/hooks/useSortQuery";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import { SortSelect } from "@/components/common/SortSelect";
import type { ProductType } from "@/types/product";

type Props = {
  products: ProductType[]; // 受け取るが未使用（将来SSR最適化用）
  initialSort: string; // "newest" | "price-asc" | "price-desc"
};

// ProductType に tags が optional の想定で安全に扱うための拡張型
type ProductWithTags = ProductType & { tags?: string[] };

const sortOptions = [
  { label: "新着順", value: "newest" },
  { label: "価格の安い順", value: "price-asc" },
  { label: "価格の高い順", value: "price-desc" },
];

function TagFilter({ tags }: { tags: string[] }) {
  const sp = useSearchParams();
  const router = useRouter();
  const current = sp.get("tag") ?? "";

  const setTag = (t: string) => {
    const p = new URLSearchParams(sp);
    if (t) p.set("tag", t);
    else p.delete("tag");
    router.push(`/product?${p.toString()}`);
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
          {t}
        </button>
      ))}
    </div>
  );
}

export default function ProductPageClient({ initialSort }: Props) {
  const { currentSort, updateSort } = useSortQuery();

  // URLの初期ソートをマウント時に同期
  useEffect(() => {
    if (initialSort && currentSort !== initialSort) {
      updateSort(initialSort);
    }
  }, [initialSort, currentSort, updateSort]);

  const { products, isLoading, hasMore, loadMore } = useProducts(currentSort);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 一覧上部のタグ（全体のユニーク）— any を使わず Set で集約
  const allTags = useMemo(() => {
    const set = new Set<string>();
    (products as ProductWithTags[]).forEach((p) => {
      (p.tags ?? []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [products]);

  // ?tag= フィルタ（クライアント側で簡易適用）
  const sp = useSearchParams();
  const currentTag = (sp.get("tag") ?? "").trim();

  const filtered: ProductType[] = useMemo(() => {
    if (!currentTag) return products;
    return (products as ProductWithTags[]).filter((p) =>
      (p.tags ?? []).includes(currentTag)
    );
  }, [products, currentTag]);

  // 無限スクロール
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;
    const observer = new IntersectionObserver(
      (entries) => entries[0]?.isIntersecting && loadMore(),
      { rootMargin: "100px" }
    );
    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="space-y-6">
      {/* セクション内ミニナビ */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h1 className="text-xl font-semibold">商品一覧</h1>
        <a href="/blog" className="text-sm text-blue-600 hover:underline">
          読みものへ
        </a>
      </div>

      <div className="flex items-center justify-between gap-4 flex-wrap">
        <SortSelect
          options={sortOptions}
          value={currentSort}
          onChange={updateSort}
        />
        {allTags.length > 0 && <TagFilter tags={allTags} />}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filtered.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {isLoading && <p className="text-center text-sm">読み込み中...</p>}
      {hasMore && <div ref={loaderRef} className="h-10" />}
      {!isLoading && filtered.length === 0 && (
        <div className="text-center text-gray-500 py-12 space-y-3">
          <p>該当する商品が見つかりませんでした。</p>
          <a href="/product" className="text-blue-600 hover:underline">
            フィルタを解除
          </a>
        </div>
      )}
    </div>
  );
}
