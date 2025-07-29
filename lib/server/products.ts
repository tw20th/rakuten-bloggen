import { dbClient } from "@/lib/firebaseClient"; // ✅ クライアント用DB
import {
  collection,
  getDocs,
  query,
  orderBy,
  limit as limitFn,
  where,
  startAfter,
  doc,
  getDoc,
  QueryConstraint,
} from "firebase/firestore";
import { ProductType } from "@/types/product";

type FetchProductsPageParams = {
  cursor?: string;
  limit?: number;
  sort?: "newest" | "popular";
  filters?: {
    hasTypeC?: boolean;
    category?: string;
    minCapacity?: number;
    maxWeight?: number;
    tags?: string[];
  };
};

export const fetchProductsPage = async ({
  cursor,
  limit = 50,
  sort = "newest",
  filters = {},
}: FetchProductsPageParams = {}): Promise<ProductType[]> => {
  const ref = collection(dbClient, "monitoredItems");

  const constraints: QueryConstraint[] = [];

  // ソート条件
  if (sort === "newest") {
    constraints.push(orderBy("createdAt", "desc"));
  } else if (sort === "popular") {
    constraints.push(orderBy("views", "desc"));
  }

  // フィルター条件
  if (filters.hasTypeC !== undefined) {
    constraints.push(where("hasTypeC", "==", filters.hasTypeC));
  }
  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }
  if (filters.minCapacity !== undefined) {
    constraints.push(where("capacity", ">=", filters.minCapacity));
  }
  if (filters.maxWeight !== undefined) {
    constraints.push(where("weight", "<=", filters.maxWeight));
  }
  if (filters.tags && filters.tags.length > 0) {
    // "tags" フィールドが array-contains-any に対応している場合
    constraints.push(where("tags", "array-contains-any", filters.tags));
  }

  // カーソル対応（ページネーション）
  if (cursor) {
    const cursorDoc = await getDoc(doc(dbClient, "monitoredItems", cursor));
    if (cursorDoc.exists()) {
      constraints.push(startAfter(cursorDoc));
    }
  }

  // 件数制限
  constraints.push(limitFn(limit));

  // クエリ生成＆取得
  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProductType, "id">),
  }));
};
