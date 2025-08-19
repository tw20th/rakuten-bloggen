// app/product/page.tsx
import ProductPageClient from "./ProductPageClient";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { serializeFirestore } from "@/utils/serializeFirestore";
import { convertToProduct } from "@/utils/convertToProduct"; // ★追加
import type { ProductType } from "@/types/product";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = searchParams.sort ?? "newest";

  const col = dbAdmin.collection("monitoredItems");
  const baseQuery =
    sort === "price-asc"
      ? col.orderBy("price", "asc")
      : sort === "price-desc"
      ? col.orderBy("price", "desc")
      : col.orderBy("createdAt", "desc");

  const snapshot = await baseQuery.limit(30).get();

  // plain に直してから convertToProduct で ProductType に整形
  const products: ProductType[] = snapshot.docs.map((doc) => {
    const plain = serializeFirestore(doc.data()) as Record<string, unknown>;
    return convertToProduct({ id: doc.id, ...plain });
  });

  return <ProductPageClient products={products} initialSort={sort} />;
}
