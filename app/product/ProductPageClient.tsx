// app/product/ProductPageClient.tsx
"use client";

import { ProductList } from "@/components/product/ProductList";
import type { ProductType } from "@/types/product";

type Props = {
  products: ProductType[];
};

export function ProductPageClient({ products }: Props) {
  return (
    <main className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        モバイルバッテリー一覧
      </h1>
      <ProductList products={products} />
    </main>
  );
}
