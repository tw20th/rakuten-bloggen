// components/product/ProductList.tsx
import { ProductCard } from "./ProductCard";
import { MonitoredItem } from "@/types/monitoredItem"; // item.ts → monitoredItem.ts に修正

type Props = {
  items: MonitoredItem[];
};

export const ProductList = ({ items }: Props) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
      {items.map((item) => (
        <ProductCard key={item.id} item={item} />
      ))}
    </div>
  );
};
