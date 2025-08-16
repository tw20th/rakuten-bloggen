"use client";

import { useEffect, useRef } from "react";
import { useSortQuery } from "@/hooks/useSortQuery";
import { useProducts } from "@/hooks/useProducts";
import ProductCard from "@/components/product/ProductCard";
import { SortSelect } from "@/components/common/SortSelect";
import type { ProductType } from "@/types/product";

type Props = {
  products: ProductType[]; // 受け取るが、この版では未使用（将来のSSR最適化用）
  initialSort: string; // "newest" | "price-asc" | "price-desc"
};

const sortOptions = [
  { label: "新着順", value: "newest" },
  { label: "価格の安い順", value: "price-asc" },
  { label: "価格の高い順", value: "price-desc" },
];

export default function ProductPageClient({ initialSort }: Props) {
  // 現行の useSortQuery は引数なしの想定
  const { currentSort, updateSort } = useSortQuery();

  // サーバ側の初期ソート（URL）をマウント時に同期
  useEffect(() => {
    if (initialSort && currentSort !== initialSort) {
      updateSort(initialSort);
    }
    // initialSort はサーバから固定で来るので依存に含めてOK
  }, [initialSort, currentSort, updateSort]);

  // 商品一覧の取得（currentSort に応じて取得）
  const { products, isLoading, hasMore, loadMore } = useProducts(currentSort);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 無限スクロール：observerで下まで来たら loadMore()
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(loaderRef.current);
    return () => observer.disconnect();
  }, [hasMore, loadMore]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SortSelect
          options={sortOptions}
          value={currentSort}
          onChange={updateSort}
        />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>

      {isLoading && <p className="text-center text-sm">読み込み中...</p>}
      {hasMore && <div ref={loaderRef} className="h-10" />}
    </div>
  );
}
