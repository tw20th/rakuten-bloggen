// app/product/ProductPageClient.tsx
"use client";

import { useEffect, useMemo, useRef } from "react";
import { useSearchParams } from "next/navigation";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import type { ProductType } from "@/types/product";
import SortControlProduct from "@/components/common/SortControlProduct";
import { parseProductSortKey, type ProductSortKey } from "@/utils/sort";
import { TagFilter } from "@/components/common/TagFilter";
import { normalizeToTagKey, toFirestoreTag } from "@/app/tags/tagConfig";

// ProductType に category/tags が optional の想定で安全に扱うための拡張型
type ProductLoose = ProductType & { tags?: string[]; category?: string | null };

export default function ProductPageClient(): JSX.Element {
  const sp = useSearchParams();
  const sortKey: ProductSortKey = parseProductSortKey(sp.get("sort"));

  const { products, isLoading, hasMore, loadMore } = useProducts(sortKey);
  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 一覧は基本 battery のみ（category が無いデータは後方互換で通す）
  const batteryOnly: ProductLoose[] = useMemo(() => {
    const arr = (products as ProductLoose[]) ?? [];
    return arr.filter((p) => (p.category ?? "battery") === "battery");
  }, [products]);

  // 一覧上部のタグ（全体のユニーク、日本語タグ想定）
  const allTags = useMemo(() => {
    const set = new Set<string>();
    batteryOnly.forEach((p) => (p.tags ?? []).forEach((t) => set.add(t)));
    return Array.from(set).sort();
  }, [batteryOnly]);

  // URLの ?tag= をキー/日本語の両対応で Firestore の日本語タグに正規化
  const urlTagParam = sp.get("tag") ?? "";
  const currentFirestoreTag = useMemo(() => {
    const key = normalizeToTagKey(urlTagParam);
    if (key) return toFirestoreTag(key); // 例: lightweight -> "軽量"
    const j = urlTagParam.trim();
    return j.length > 0 ? j : null; // すでに「軽量」「大容量」等ならそのまま
  }, [urlTagParam]);

  // 表示用フィルタ（tag）
  const filtered: ProductType[] = useMemo(() => {
    if (!currentFirestoreTag) return batteryOnly;
    return batteryOnly.filter((p) =>
      (p.tags ?? []).includes(currentFirestoreTag)
    );
  }, [batteryOnly, currentFirestoreTag]);

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
        {/* タグフィルタ（props 必須） */}
        {allTags.length > 0 && <TagFilter allTags={allTags} />}
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
