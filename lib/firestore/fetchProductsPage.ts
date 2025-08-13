// lib/firestore/fetchProductsPage.ts
import { db } from "@/lib/firebase/server"; // Firebase Admin SDK
import { ProductType } from "@/types/product";
import { DocumentData, QueryDocumentSnapshot } from "firebase-admin/firestore";

const COLLECTION_NAME = "monitoredItems";

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

export async function fetchProductsPage(params: {
  sort: string;
  limit: number;
  cursor?: string;
}): Promise<{
  products: ProductType[];
  nextCursor: string | null;
}> {
  const { sort, limit: pageSize, cursor } = params;
  const { field, direction } = getSortFieldAndDirection(sort);

  const colRef = db.collection(COLLECTION_NAME);
  let q = colRef.orderBy(field, direction).limit(pageSize);

  if (cursor) {
    const cursorDoc = await colRef.doc(cursor).get();
    if (cursorDoc.exists) {
      q = q.startAfter(cursorDoc);
    }
  }

  const snapshot = await q.get();

  const products: ProductType[] = [];
  let lastDoc: QueryDocumentSnapshot<DocumentData> | null = null;

  snapshot.forEach((doc) => {
    const data = doc.data() as ProductType;
    products.push({ ...data, id: doc.id }); // ✅ id を明示的に追加
    lastDoc = doc;
  });

  return {
    products,
    nextCursor: lastDoc ? lastDoc.id : null,
  };
}
