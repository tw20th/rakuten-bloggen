// components/blog/RelatedProduct.tsx
import type { Item } from "@/types/item";
import Image from "next/image";

export default function RelatedProduct({ item }: { item: Item }) {
  return (
    <div className="border p-4 rounded">
      <h3 className="text-lg font-bold mb-2">{item.displayName}</h3>
      <Image
        src={item.imageUrl}
        alt={item.displayName ?? "商品画像"}
        width={400}
        height={300}
        className="w-full h-auto mb-2"
      />
      <p className="text-sm text-gray-700">{item.description}</p>
      <a
        href={item.affiliateUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="text-blue-600 underline mt-2 block"
      >
        商品を見る
      </a>
    </div>
  );
}
