// lib/firestore/fetchProductsPage.ts
import { dbClient } from "@/lib/firebaseClient";
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

  if (sort === "newest") {
    constraints.push(orderBy("createdAt", "desc"));
  } else if (sort === "popular") {
    constraints.push(orderBy("views", "desc"));
  }

  if (filters.hasTypeC !== undefined) {
    constraints.push(where("hasTypeC", "==", filters.hasTypeC));
  }
  if (filters.category) {
    constraints.push(where("category", "==", filters.category));
  }

  if (cursor) {
    const cursorDoc = await getDoc(doc(dbClient, "monitoredItems", cursor));
    if (cursorDoc.exists()) {
      constraints.push(startAfter(cursorDoc));
    }
  }

  constraints.push(limitFn(limit));
  const q = query(ref, ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map((doc) => ({
    id: doc.id,
    ...(doc.data() as Omit<ProductType, "id">),
  }));
};
