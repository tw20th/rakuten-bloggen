// lib/firestore/fetchProductsPage.ts
import { db } from "@/lib/firebase"; // Admin SDK の Firestore
import type { ProductType } from "@/types/product";
import { tsToISOString } from "@/types";
import type {
  QueryDocumentSnapshot,
  DocumentData,
} from "firebase-admin/firestore";

const COLLECTION_NAME = "monitoredItems";

// Timestamp を判定する型ガード（Admin/Client両対応）
function hasToDate(v: unknown): v is { toDate: () => Date } {
  return (
    typeof v === "object" &&
    v !== null &&
    typeof (v as { toDate?: unknown }).toDate === "function"
  );
}

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

  for (const doc of snapshot.docs as QueryDocumentSnapshot<DocumentData>[]) {
    const data = doc.data() as Record<string, unknown>;

    // priceHistory 正規化（string or Timestamp → ISO string）
    const priceHistory = Array.isArray(data.priceHistory)
      ? (data.priceHistory as Array<{ date?: unknown; price?: unknown }>)
          .map((e) => {
            const dateVal = e?.date;
            const iso =
              typeof dateVal === "string"
                ? dateVal
                : hasToDate(dateVal)
                ? dateVal.toDate().toISOString()
                : "";
            const price = typeof e?.price === "number" ? e.price : 0;
            return iso ? { date: iso, price } : null;
          })
          .filter((x): x is { date: string; price: number } => x !== null)
      : [];

    products.push({
      id: doc.id,
      productName: String(data.productName ?? ""),
      imageUrl: String(data.imageUrl ?? ""),
      price: typeof data.price === "number" ? data.price : 0,
      itemPrice:
        typeof (data as { itemPrice?: unknown }).itemPrice === "number"
          ? (data as { itemPrice: number }).itemPrice
          : undefined,

      // スペック（null は ProductType 的に undefined に寄せる）
      capacity: typeof data.capacity === "number" ? data.capacity : undefined,
      outputPower:
        typeof data.outputPower === "number" ? data.outputPower : undefined,
      weight: typeof data.weight === "number" ? data.weight : undefined,
      hasTypeC: Boolean(data.hasTypeC),

      // 分類・特徴
      tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      category: String(data.category ?? ""),
      featureHighlights: Array.isArray(data.featureHighlights)
        ? (data.featureHighlights as string[])
        : [],
      aiSummary: String(data.aiSummary ?? ""),

      // 表示情報
      views: typeof data.views === "number" ? data.views : 0,
      priceHistory,
      affiliateUrl: String(data.affiliateUrl ?? ""),

      // 管理用（Timestamp or string → string）
      createdAt: tsToISOString(
        (data.createdAt ?? "") as
          | FirebaseFirestore.Timestamp
          | { toDate: () => Date }
          | string
      ),
      updatedAt: tsToISOString(
        (data.updatedAt ?? "") as
          | FirebaseFirestore.Timestamp
          | { toDate: () => Date }
          | string
      ),
    });

    lastDoc = doc;
  }

  return {
    products,
    nextCursor: lastDoc ? lastDoc.id : null,
  };
}
