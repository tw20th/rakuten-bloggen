"use client";

import { useState } from "react";
import { useFilteredProducts } from "@/hooks/useFilteredProducts";
import { ProductList } from "@/components/product/ProductList";
import { FilterPanel } from "@/components/product/FilterPanel";
import { SortSelect } from "@/components/product/SortSelect";

export function ProductPageClient() {
  const [sortBy, setSortBy] = useState<"createdAt" | "price" | "capacity">(
    "createdAt"
  );
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [hasTypeC, setHasTypeC] = useState<boolean | undefined>();
  const [minCapacity, setMinCapacity] = useState<number | undefined>();

  const { products, loading } = useFilteredProducts({
    sortBy,
    sortOrder,
    hasTypeC,
    minCapacity,
  });

  return (
    <main className="p-4 sm:p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl sm:text-3xl font-bold mb-6">
        モバイルバッテリー一覧
      </h1>

      <SortSelect
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortByChange={setSortBy}
        onSortOrderChange={setSortOrder}
      />

      <FilterPanel
        hasTypeC={hasTypeC}
        minCapacity={minCapacity}
        onHasTypeCChange={setHasTypeC}
        onMinCapacityChange={setMinCapacity}
      />

      {loading ? <p>読み込み中...</p> : <ProductList products={products} />}
    </main>
  );
}
