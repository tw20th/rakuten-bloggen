// app/products/page.tsx

export const dynamic = "force-dynamic";

import { db } from "@/lib/firebase";
import { ProductCard } from "@/components/product/ProductCard";
import type { MonitoredItem, MonitoredItemDoc } from "@/types/monitoredItem";

export default async function ProductListPage() {
  const snapshot = await db
    .collection("monitoredItems")
    .orderBy("updatedAt", "desc")
    .limit(20)
    .get();

  const products: MonitoredItem[] = snapshot.docs.map((doc) => {
    const data = doc.data() as MonitoredItemDoc;
    return {
      id: doc.id,
      productName: data.productName,
      imageUrl: data.imageUrl,
      price: data.price,
      capacity: data.capacity,
      outputPower: data.outputPower,
      weight: data.weight,
      hasTypeC: data.hasTypeC,
      tags: data.tags ?? [],
      featureHighlights: data.featureHighlights ?? [],
      aiSummary: data.aiSummary ?? "",
      priceHistory: data.priceHistory ?? [],
      affiliateUrl: data.affiliateUrl,
      createdAt: data.createdAt?.toMillis() ?? null,
      updatedAt: data.updatedAt?.toMillis() ?? null,
    };
  });

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">商品一覧</h1>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {products.map((item) => (
          <ProductCard key={item.id} item={item} />
        ))}
      </div>
    </div>
  );
}
