// components/product/ProductList.tsx
import type { ProductType } from "@/types/product";
import ProductCard from "@/components/product/ProductCard";

type Props = {
  products: ProductType[];
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
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
