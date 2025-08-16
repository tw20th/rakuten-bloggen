// app/hooks/useProducts.ts

import { useEffect, useState } from "react";
import {
  collection,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  DocumentData,
  QueryDocumentSnapshot,
} from "firebase/firestore";
import { ProductType } from "@/types/product";
import { dbClient as db } from "@/lib/firebaseClient"; // ← 統一：ここだけでOK

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

  const colRef = collection(db, "monitoredItems");

  // 初期ロード or ソート変更時
  useEffect(() => {
    const fetchInitial = async () => {
      setIsLoading(true);
      const { field, direction } = getSortFieldAndDirection(sort);

      const q = query(colRef, orderBy(field, direction), limit(PAGE_SIZE));
      const snapshot = await getDocs(q);

      const items = snapshot.docs.map((doc) => ({
        ...(doc.data() as ProductType),
        id: doc.id,
      }));

      setProducts(items);
      setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
      setHasMore(snapshot.docs.length === PAGE_SIZE);
      setIsLoading(false);
    };

    fetchInitial();
    // colRef は安定参照なので依存に入れない
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sort]);

  // 無限スクロール用の読み込み関数
  const loadMore = async () => {
    if (isLoading || !hasMore || !lastDoc) return;

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
    setLastDoc(snapshot.docs[snapshot.docs.length - 1] ?? null);
    setHasMore(snapshot.docs.length === PAGE_SIZE);
    setIsLoading(false);
  };

  return {
    products,
    isLoading,
    hasMore,
    loadMore,
  };
}
