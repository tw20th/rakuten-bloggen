// utils/convertToProduct.ts
import type { ProductType } from "@/types/product";

type TimestampLike = { toDate(): Date };

function hasToDate(obj: unknown): obj is TimestampLike {
  if (typeof obj !== "object" || obj === null) return false;
  if (!("toDate" in obj)) return false;
  const maybe = obj as { toDate: unknown };
  return typeof maybe.toDate === "function";
}

type InputItem = Partial<ProductType> & {
  itemCode?: string;
  itemName?: string;
  itemPrice?: number;
  createdAt?: string | TimestampLike | Date | null;
  updatedAt?: string | TimestampLike | Date | null;
};

const toNum = (v: unknown): number =>
  typeof v === "number" && !Number.isNaN(v) ? v : 0;

function toIso(
  input: string | TimestampLike | Date | null | undefined
): string {
  if (typeof input === "string") return input;
  if (input instanceof Date) return input.toISOString();
  if (hasToDate(input)) return input.toDate().toISOString();
  return "";
}

export function convertToProduct(item: InputItem): ProductType {
  const price = toNum(item.price ?? item.itemPrice);

  return {
    id: item.id ?? item.itemCode ?? "",
    productName: item.productName ?? item.itemName ?? "無名商品",
    imageUrl: item.imageUrl ?? "",
    price,

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

    createdAt: toIso(item.createdAt ?? null),
    updatedAt: toIso(item.updatedAt ?? null),
  };
}
