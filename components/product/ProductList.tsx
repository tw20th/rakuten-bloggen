// components/product/ProductList.tsx
import type { MonitoredItem } from "@/types/monitoredItem";
import ProductCard from "@/components/product/ProductCard";
import { FadeInOnScroll } from "@/components/common/FadeInOnScroll";

type Props = {
  products: MonitoredItem[];
};

export function ProductList({ products }: Props) {
  if (products.length === 0) {
    return (
      <div className="text-center text-gray-500 py-12">
        商品が見つかりませんでした。
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product) => (
        <FadeInOnScroll key={product.id}>
          <ProductCard product={product} />
        </FadeInOnScroll>
      ))}
    </div>
  );
}
