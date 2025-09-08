// components/blog/RelatedProduct.tsx
import type { Item } from "@/types/item";
import Image from "next/image";
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl"; // ★ 追加

export default function RelatedProduct({ item }: { item: Item }) {
  const imgHi = item.imageUrl
    ? upgradeRakutenImageUrl(item.imageUrl, 800) // ★ 高解像度指定
    : "/no-image.png";

  return (
    <div className="border p-4 rounded">
      <h3 className="text-lg font-bold mb-2">{item.displayName}</h3>
      <div className="relative w-full aspect-video mb-2 bg-white rounded">
        <Image
          src={imgHi}
          alt={item.displayName ?? "商品画像"}
          fill
          style={{ objectFit: "contain" }}
          sizes="(max-width: 640px) 100vw, 400px"
        />
      </div>
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
