import { useEffect, useMemo, useState } from "react";
import { getDocs } from "firebase/firestore";
import { buildProductQuery } from "@/utils/buildProductQuery";
import { MonitoredItem } from "@/types/monitoredItem";

type FilterParams = {
  hasTypeC?: boolean;
  minCapacity?: number;
  minOutput?: number;
  tag?: string;
  sortBy?: "createdAt" | "price" | "capacity";
  sortOrder?: "asc" | "desc";
};

export const useFilteredProducts = (params: FilterParams) => {
  const [products, setProducts] = useState<MonitoredItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 🔍 パラメータを安定化させて依存配列を正しく扱う
  const paramsString = useMemo(() => JSON.stringify(params), [params]);

  useEffect(() => {
    const fetch = async () => {
      try {
        setLoading(true);
        setError(null);
        const q = buildProductQuery(params);
        const snapshot = await getDocs(q);
        const items = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toMillis?.() ?? null,
          updatedAt: doc.data().updatedAt?.toMillis?.() ?? null,
        })) as MonitoredItem[];

        setProducts(items);
      } catch (err) {
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };

    fetch();
  }, [paramsString]); // ✅ 安定した依存でESLint警告なし

  return { products, loading, error };
};
