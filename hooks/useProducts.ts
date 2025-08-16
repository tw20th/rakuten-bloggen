// app/hooks/useProducts.ts
import { useEffect, useMemo, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  type DocumentData,
  type QueryDocumentSnapshot,
} from "firebase/firestore";
import { type ProductType } from "@/types/product";
import { dbClient as db } from "@/lib/firebaseClient";

const PAGE_SIZE = 30;

function getSortFieldAndDirection(sort: string): {
  field: string;
  direction: "asc" | "desc";
} {
  switch (sort) {
    case "price-asc":
      return { field: "price", direction: "asc" };
    case "price-desc":
      return { field: "price", direction: "desc" };
    case "newest":
    default:
      return { field: "createdAt", direction: "desc" };
  }
}

export function useProducts(sort: string) {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

  // 安定参照（eslint: exhaustive-deps回避）
  const colRef = useMemo(() => collection(db, "monitoredItems"), []);

  // 初期ロード / ソート変更時
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setIsLoading(true);
        const { field, direction } = getSortFieldAndDirection(sort);
        const q = query(colRef, orderBy(field, direction), limit(PAGE_SIZE));
        const snapshot = await getDocs(q);
        if (cancelled) return;

        const items = snapshot.docs.map((d) => ({
          ...(d.data() as ProductType),
          id: d.id,
        }));
        setProducts(items);
        setLastDoc(snapshot.docs.at(-1) ?? null);
        setHasMore(snapshot.docs.length === PAGE_SIZE);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [sort, colRef]);

  // 無限スクロール
  const loadMore = async () => {
    if (isLoading || !hasMore || !lastDoc) return;
    try {
      setIsLoading(true);
      const { field, direction } = getSortFieldAndDirection(sort);
      const q = query(
        colRef,
        orderBy(field, direction),
        startAfter(lastDoc),
        limit(PAGE_SIZE)
      );
      const snapshot = await getDocs(q);

      const newItems = snapshot.docs.map((doc) => ({
        ...(doc.data() as ProductType),
        id: doc.id,
      }));

      setProducts((prev) => [...prev, ...newItems]);
      setLastDoc(snapshot.docs.at(-1) ?? null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
    } finally {
      setIsLoading(false);
    }
  };

  return { products, isLoading, hasMore, loadMore };
}
