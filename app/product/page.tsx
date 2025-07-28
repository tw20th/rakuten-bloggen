// app/product/page.tsx
"use client";

import { useProducts } from "@/hooks/useProducts";
import { ProductList } from "@/components/product/ProductList";
import { useState } from "react";

export default function ProductPage() {
  const { products } = useProducts();
  const [visibleCount, setVisibleCount] = useState(20);

  const visibleProducts = products.slice(0, visibleCount);

  return (
    <div className="max-w-6xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">モバイルバッテリー一覧</h1>
      <ProductList items={visibleProducts} />
      {visibleCount < products.length && (
        <div className="flex justify-center mt-6">
          <button
            onClick={() => setVisibleCount((prev) => prev + 20)}
            className="px-6 py-2 bg-gray-100 hover:bg-gray-200 rounded shadow text-sm"
          >
            もっと見る
          </button>
        </div>
      )}
    </div>
  );
}
