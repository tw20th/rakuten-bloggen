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
import { type ProductSortKey } from "@/utils/sort";

const PAGE_SIZE = 30;

function getSortFieldAndDirection(sort: ProductSortKey): {
  field: "createdAt" | "price" | "views" | "capacity" | "reviewAverage";
  direction: "asc" | "desc";
} {
  switch (sort) {
    case "cheap":
      return { field: "price", direction: "asc" };
    case "newest":
      return { field: "createdAt", direction: "desc" };
    case "capacity-desc":
      return { field: "capacity", direction: "desc" };
    case "capacity-asc":
      return { field: "capacity", direction: "asc" };
    case "rating-desc":
      return { field: "reviewAverage", direction: "desc" };
    case "popular":
    default:
      return { field: "views", direction: "desc" };
  }
}

export function useProducts(sort: ProductSortKey) {
  const [products, setProducts] = useState<ProductType[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [lastDoc, setLastDoc] =
    useState<QueryDocumentSnapshot<DocumentData> | null>(null);

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
