"use client";

import type { ProductType } from "@/types/product";
import type { PriceHistoryEntry } from "@/types/monitoredItem";
import { Card, CardContent } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { computeBadges } from "@/utils/badges";

type ProductWithHistory = ProductType & {
  priceHistory?: PriceHistoryEntry[];
};

type Props = { product: ProductWithHistory };

export default function ProductCard({ product }: Props) {
  const history: PriceHistoryEntry[] = product.priceHistory ?? [];

  const badges = computeBadges({
    currentPrice: typeof product.price === "number" ? product.price : undefined,
    history,
    // inStock は将来対応：未指定ならバッジは出ない
  });

  return (
    <Link href={`/product/${product.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <div className="relative">
          <Image
            src={product.imageUrl}
            alt={product.productName}
            width={500}
            height={300}
            className="w-full h-48 object-contain p-4"
          />
          {/* バッジ（画像の左上） */}
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {badges.map((b, i) => (
                <span
                  key={`${b.type}-${i}`}
                  className={
                    b.type === "price-drop"
                      ? "bg-green-100 text-green-700 px-2 py-0.5 text-xs rounded-full"
                      : b.type === "lowest-update"
                      ? "bg-blue-100 text-blue-700 px-2 py-0.5 text-xs rounded-full"
                      : "bg-amber-100 text-amber-700 px-2 py-0.5 text-xs rounded-full"
                  }
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <CardContent className="space-y-2 px-4 pb-4">
          <h2 className="text-base font-semibold line-clamp-2">
            {product.productName}
          </h2>
          <div className="text-lg font-bold text-red-600">
            {typeof product.price === "number"
              ? `¥${product.price.toLocaleString()}`
              : "価格情報なし"}
          </div>
          <div className="flex flex-wrap gap-1">
            {(product.tags ?? []).slice(0, 3).map((tag) => (
              <UiBadge key={tag} className="text-xs" variant="outline">
                {tag}
              </UiBadge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
