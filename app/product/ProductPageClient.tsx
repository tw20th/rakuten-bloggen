"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import type { ProductType } from "@/types/product";
import SortControlProduct from "@/components/common/SortControlProduct";
import { parseProductSortKey, type ProductSortKey } from "@/utils/sort";

// ProductType に tags が optional の想定で安全に扱うための拡張型
type ProductWithTags = ProductType & { tags?: string[] };

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

export default function ProductPageClient(): JSX.Element {
  const sp = useSearchParams();
  const sortKey: ProductSortKey = parseProductSortKey(sp.get("sort"));

  const { products, isLoading, hasMore, loadMore } = useProducts(sortKey);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 一覧上部のタグ（全体のユニーク）
  const allTags = useMemo(() => {
    const set = new Set<string>();
    (products as ProductWithTags[]).forEach((p) => {
      (p.tags ?? []).forEach((t) => set.add(t));
    });
    return Array.from(set).sort();
  }, [products]);

  // ?tag= フィルタ（クライアント側で簡易適用）
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
        {/* 並び替え（URL ?sort= を更新） */}
        <SortControlProduct />
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
