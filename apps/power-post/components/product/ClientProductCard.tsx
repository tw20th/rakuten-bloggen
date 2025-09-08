"use client";

import Image from "next/image";
import Link from "next/link";
import { FC } from "react";

export type ProductCardProps = {
  id: string;
  imageUrl: string;
  productName: string;
  price: number;
  capacity?: number;
  hasTypeC?: boolean;
  affiliateUrl?: string;
};

const ProductCard: FC<ProductCardProps> = ({
  id,
  imageUrl,
  productName,
  price,
  capacity,
  hasTypeC,
  affiliateUrl,
}) => {
  return (
    <div className="rounded-2xl border p-4 shadow-sm hover:shadow-md transition">
      <Link href={`/product/${id}`}>
        <div className="relative w-full h-48 mb-4">
          <Image
            src={imageUrl}
            alt={productName}
            fill
            className="object-contain"
            sizes="(max-width: 768px) 100vw, 33vw"
            priority
          />
        </div>
      </Link>

      <div className="space-y-1 text-sm text-gray-700">
        {capacity && <p>容量: {capacity}mAh</p>}
        {hasTypeC && <p>Type-C 対応: ✅</p>}
      </div>

      <div className="mt-2 flex justify-between items-center">
        <p className="text-green-600 font-bold text-lg">
          ¥{price.toLocaleString()}
        </p>

        {affiliateUrl && (
          <a
            href={affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs bg-gray-100 hover:bg-gray-200 rounded px-3 py-1"
          >
            楽天で見る
          </a>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
