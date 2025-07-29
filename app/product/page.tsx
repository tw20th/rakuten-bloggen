// app/product/page.tsx
import { ProductPageClient } from "./ProductPageClient";
import { dbAdmin } from "@/lib/firebaseAdmin"; // ← ✅ 統一されたAdmin Firestore
import { ProductType } from "@/types/product";

export const dynamic = "force-dynamic"; // SSRで最新反映

export default async function ProductPage() {
  const snapshot = await dbAdmin
    .collection("monitoredItems")
    .orderBy("createdAt", "desc")
    .limit(30)
    .get();

  const products = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
      updatedAt: data.updatedAt?.toDate?.().toISOString() ?? "",
    };
  }) as ProductType[];

  return <ProductPageClient products={products} />;
}
