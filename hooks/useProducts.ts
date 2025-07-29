// hooks/useProducts.ts
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { ProductType } from "@/types/product";
// まだ ProductType がなければ↓を一時的に使ってください（重複定義に注意）
// export type ProductType = {
//   id: string; // FirestoreのドキュメントID
//   productName: string;
//   imageUrl: string;
//   price: number;
//   capacity?: number;
//   outputPower?: number;
//   weight?: number;
//   hasTypeC?: boolean;
//   tags: string[];
//   category: string;
//   views: number;
//   featureHighlights?: string[];
//   aiSummary?: string;
//   priceHistory: { date: string; price: number }[]; // ISO文字列 or "YYYY-MM-DD"
//   affiliateUrl: string;
//   createdAt: string;
//   updatedAt: string;
// };

type ProductSort = "newest" | "popular" | "price_asc" | "price_desc";

export type ProductFilters = {
  tags?: string[];
  category?: string;
  hasTypeC?: boolean;
  minCapacity?: number;
  maxWeight?: number;
};

type ProductsApiResponse = {
  items: ProductType[];
  nextCursor?: string;
};

export type UseProductsQuery = {
  sort?: ProductSort;
  filters?: ProductFilters;
  pageSize?: number;
};

type UseProductsOptions = {
  initialItems: ProductType[];
  initialCursor?: string;
  /** true にすると sentinel に入ったら自動で次ページを読み込みます */
  auto?: boolean;
  /** 初期クエリ（sort/filters/pageSize） */
  initialQuery?: UseProductsQuery;
};

export function useProducts({
  initialItems,
  initialCursor,
  auto = false,
  initialQuery,
}: UseProductsOptions) {
  const [products, setProducts] = useState<ProductType[]>(initialItems);
  const [cursor, setCursor] = useState<string | undefined>(initialCursor);
  const [hasMore, setHasMore] = useState<boolean>(!!initialCursor);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  // クエリ（filters / sort / pageSize）を保持
  const [query, setQuery] = useState<UseProductsQuery>(
    () => initialQuery ?? {}
  );

  // 無限スクロール用の監視ターゲット
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const buildQueryString = useCallback(
    (nextCursor?: string) => {
      const sp = new URLSearchParams();

      if (nextCursor) sp.set("cursor", nextCursor);
      if (query.pageSize) sp.set("limit", String(query.pageSize));
      if (query.sort) sp.set("sort", query.sort);

      const f = query.filters;
      if (f) {
        if (typeof f.hasTypeC === "boolean")
          sp.set("hasTypeC", String(f.hasTypeC));
        if (f.category) sp.set("category", f.category);
        if (typeof f.minCapacity === "number")
          sp.set("minCapacity", String(f.minCapacity));
        if (typeof f.maxWeight === "number")
          sp.set("maxWeight", String(f.maxWeight));
        if (f.tags && f.tags.length > 0) sp.set("tags", f.tags.join(","));
      }
      return sp.toString();
    },
    [query]
  );

  const fetchNext = useCallback(async () => {
    if (!hasMore || isLoading) return;

    setIsLoading(true);
    try {
      const qs = buildQueryString(cursor);
      const res = await fetch(`/api/products${qs ? `?${qs}` : ""}`, {
        cache: "no-store",
      });
      if (!res.ok) {
        console.error("Failed to fetch products:", await res.text());
        return;
      }
      const data = (await res.json()) as ProductsApiResponse;
      setProducts((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
      setHasMore(Boolean(data.nextCursor));
    } finally {
      setIsLoading(false);
    }
  }, [buildQueryString, cursor, hasMore, isLoading]);

  const loadMore = useCallback(async () => {
    await fetchNext();
  }, [fetchNext]);

  // クエリ変更時にリセットして再取得（先頭ページから）
  const reload = useCallback(
    async (nextQuery?: UseProductsQuery) => {
      const q = nextQuery ? nextQuery : query;
      setQuery(q);
      setIsLoading(true);
      try {
        const qs = buildQueryString(undefined);
        const res = await fetch(`/api/products${qs ? `?${qs}` : ""}`, {
          cache: "no-store",
        });
        if (!res.ok) {
          console.error("Failed to reload products:", await res.text());
          return;
        }
        const data = (await res.json()) as ProductsApiResponse;
        setProducts(data.items);
        setCursor(data.nextCursor);
        setHasMore(Boolean(data.nextCursor));
      } finally {
        setIsLoading(false);
      }
    },
    [buildQueryString, query]
  );

  // 無限スクロール: sentinel が可視になったら自動で読み込み
  useEffect(() => {
    if (!auto) return;
    if (!hasMore) return;

    const el = sentinelRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          // ビューポートに入ったら次ページ取得
          void fetchNext();
        }
      },
      { rootMargin: "200px 0px" } // 余裕をもって事前ロード
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [auto, fetchNext, hasMore]);

  const state = useMemo(
    () => ({ products, isLoading, hasMore, cursor, query }),
    [products, isLoading, hasMore, cursor, query]
  );

  return {
    ...state,
    /** 次ページを手動ロード（ボタン用） */
    loadMore,
    /** クエリを更新して先頭から再取得 */
    setQueryAndReload: reload,
    /** 無限スクロール用の監視ターゲット */
    sentinelRef,
  };
}
