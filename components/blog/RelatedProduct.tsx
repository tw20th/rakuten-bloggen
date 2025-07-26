// components/blog/RelatedProduct.tsx
"use client";

import Image from "next/image";

type Item = {
  itemName: string;
  itemPrice: number;
  affiliateUrl: string;
  imageUrl: string;
  shopName: string;
};

export default function RelatedProduct({ item }: { item: Item }) {
  return (
    <a
      href={item.affiliateUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block border rounded-xl p-4 hover:shadow-md transition"
    >
      <div className="flex items-center gap-4">
        <Image
          src={item.imageUrl}
          alt={item.itemName}
          width={96}
          height={96}
          className="object-contain"
        />
        <div>
          <p className="font-semibold">{item.itemName}</p>
          <p className="text-sm text-gray-500">{item.shopName}</p>
          <p className="text-red-500 font-bold mt-1">
            ¥{item.itemPrice.toLocaleString()}
          </p>
        </div>
      </div>
    </a>
  );
}
