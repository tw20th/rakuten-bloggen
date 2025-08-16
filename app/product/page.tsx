// app/product/page.tsx
import ProductPageClient from "./ProductPageClient";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { ProductType } from "@/types/product";
import { Query, DocumentData } from "firebase-admin/firestore";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  searchParams,
}: {
  searchParams: { sort?: string };
}) {
  const sort = searchParams.sort ?? "newest";

  let query: Query<DocumentData> = dbAdmin.collection("monitoredItems");

  if (sort === "price-asc") {
    query = query.orderBy("price", "asc");
  } else if (sort === "price-desc") {
    query = query.orderBy("price", "desc");
  } else {
    query = query.orderBy("createdAt", "desc");
  }

  const snapshot = await query.limit(30).get();

  const products = snapshot.docs.map((doc) => {
    const data = doc.data();
    return {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.().toISOString() ?? "",
      updatedAt: data.updatedAt?.toDate?.().toISOString() ?? "",
    };
  }) as ProductType[];

  return <ProductPageClient products={products} initialSort={sort} />;
}
