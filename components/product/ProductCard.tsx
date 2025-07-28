// components/product/ProductCard.tsx

"use client";

import Link from "next/link";
import type { MonitoredItem } from "@/types/monitoredItem";

type Props = {
  item: MonitoredItem;
};

export const ProductCard = ({ item }: Props) => {
  return (
    <Link
      href={`/product/${item.id}`}
      className="border rounded-xl p-4 hover:shadow-md transition flex flex-col"
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={item.imageUrl}
        alt={item.productName}
        className="w-full h-48 object-contain mb-3 rounded"
      />
      <h2 className="text-lg font-semibold line-clamp-2">{item.productName}</h2>
      <p className="text-green-600 font-bold text-sm mt-1">
        ¥{item.price.toLocaleString()}
      </p>

      {item.tags?.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {item.tags.slice(0, 3).map((tag) => (
            <span
              key={tag}
              className="text-xs bg-gray-100 border rounded px-2 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
};
