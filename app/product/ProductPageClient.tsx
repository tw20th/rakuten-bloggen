// app/product/ProductPageClient.tsx

"use client";

import { useEffect, useRef } from "react";
import { useSortQuery } from "@/hooks/useSortQuery";
import { useProducts } from "@/hooks/useProducts";
import { ProductCard } from "@/components/product/ProductCard";
import { SortSelect } from "@/components/common/SortSelect";

export default function ProductPageClient() {
  const { sort, setSort } = useSortQuery();
  const { products, isLoading, hasMore, loadMore } = useProducts(sort);

  const loaderRef = useRef<HTMLDivElement | null>(null);

  // 無限スクロール：observerで下まで来たら loadMore()
  useEffect(() => {
    if (!loaderRef.current || !hasMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadMore();
        }
      },
      { rootMargin: "100px" }
    );

    observer.observe(loaderRef.current);

    return () => {
      observer.disconnect();
    };
  }, [loaderRef.current, hasMore, loadMore]);

  return (
    <div className="space-y-6">
      <div className="flex justify-end">
        <SortSelect sort={sort} setSort={setSort} />
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {products.map((product) => (
          <ProductCard key={product.id} item={product} />
        ))}
      </div>

      {isLoading && <p className="text-center text-sm">読み込み中...</p>}

      {/* 無限スクロール用の監視ターゲット */}
      {hasMore && <div ref={loaderRef} className="h-10" />}
    </div>
  );
}
