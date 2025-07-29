// components/product/ProductCard.tsx
"use client";

import type { ProductType } from "@/types/product";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";

type Props = {
  product: ProductType;
};

export default function ProductCard({ product }: Props) {
  return (
    <Link href={`/product/${product.id}`} className="block">
      <Card className="hover:shadow-lg transition-shadow duration-200">
        <Image
          src={product.imageUrl}
          alt={product.productName}
          width={500}
          height={300}
          className="w-full h-48 object-contain p-4"
        />
        <CardContent className="space-y-2 px-4 pb-4">
          <h2 className="text-base font-semibold line-clamp-2">
            {product.productName}
          </h2>
          <div className="text-lg font-bold text-red-600">
            ¥{product.price.toLocaleString()}
          </div>
          <div className="flex flex-wrap gap-1">
            {product.tags.slice(0, 3).map((tag) => (
              <Badge key={tag} className="text-xs" variant="outline">
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
