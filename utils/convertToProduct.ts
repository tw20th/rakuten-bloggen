// utils/convertToProduct.ts
import type { ProductType } from "@/types/product";

// toDate を持つかどうかの型ガード
function hasToDate(obj: unknown): obj is { toDate: () => Date } {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "toDate" in obj &&
    typeof (obj as { toDate: () => unknown }).toDate === "function"
  );
}

type InputItem = Partial<ProductType> & {
  itemCode?: string;
  itemName?: string;
  itemPrice?: number;
  createdAt?: string | { toDate(): Date } | null;
  updatedAt?: string | { toDate(): Date } | null;
};

export function convertToProduct(item: InputItem): ProductType {
  return {
    id: item.id ?? item.itemCode ?? "",
    productName: item.productName ?? item.itemName ?? "無名商品",
    imageUrl: item.imageUrl ?? "",
    price: item.price ?? item.itemPrice ?? 0,

    capacity: item.capacity ?? undefined,
    outputPower: item.outputPower ?? undefined,
    weight: item.weight ?? undefined,
    hasTypeC: item.hasTypeC ?? false,

    tags: item.tags ?? [],
    category: item.category ?? "未分類",
    featureHighlights: item.featureHighlights ?? [],
    aiSummary: item.aiSummary,

    views: item.views ?? 0,
    priceHistory: item.priceHistory ?? [],
    affiliateUrl: item.affiliateUrl ?? "",

    createdAt:
      typeof item.createdAt === "string"
        ? item.createdAt
        : hasToDate(item.createdAt)
        ? (item.createdAt as { toDate(): Date }).toDate().toISOString()
        : "",

    updatedAt:
      typeof item.updatedAt === "string"
        ? item.updatedAt
        : hasToDate(item.updatedAt)
        ? (item.updatedAt as { toDate(): Date }).toDate().toISOString()
        : "",
  };
}
