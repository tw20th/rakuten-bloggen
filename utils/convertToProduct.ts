// utils/convertToProduct.ts
import type { ProductType } from "@/types/product";

type RawDoc = Record<string, unknown>;

// Firestore Timestamp ライク型ガード
type TimestampLike = { toDate: () => Date };
function isTimestampLike(d: unknown): d is TimestampLike {
  return (
    typeof d === "object" &&
    d !== null &&
    "toDate" in d &&
    typeof (d as { toDate: unknown }).toDate === "function"
  );
}

function toISO(d: unknown): string {
  try {
    if (isTimestampLike(d)) return d.toDate().toISOString();
    if (d instanceof Date) return d.toISOString();
    if (typeof d === "string") {
      const t = new Date(d);
      return Number.isNaN(t.getTime()) ? "" : t.toISOString();
    }
    return "";
  } catch {
    return "";
  }
}

function toNumberOrUndefined(v: unknown): number | undefined {
  return typeof v === "number" && !Number.isNaN(v) ? v : undefined;
}
function toStringOr(v: unknown, fallback = ""): string {
  return typeof v === "string" ? v : fallback;
}
function toBooleanOrNull(v: unknown): boolean | null {
  return typeof v === "boolean" ? v : null;
}

export function convertToProduct(doc: RawDoc): ProductType {
  // price
  const priceMaybe =
    toNumberOrUndefined(doc.price) ?? toNumberOrUndefined(doc.itemPrice);

  // priceHistory
  const historyRaw = Array.isArray(doc.priceHistory)
    ? (doc.priceHistory as RawDoc[])
    : [];
  const priceHistory = historyRaw
    .map((h) => {
      const dateISO = toISO((h as RawDoc)?.date);
      const p = toNumberOrUndefined((h as RawDoc)?.price);
      if (!dateISO || p === undefined) return null;
      return { date: dateISO, price: p };
    })
    .filter((x): x is { date: string; price: number } => x !== null);

  // 在庫・レビュー
  const inStock =
    toBooleanOrNull(doc.inStock) ??
    (typeof doc.availability === "number"
      ? (doc.availability as number) === 1
      : null);
  const reviewAverage = toNumberOrUndefined(doc.reviewAverage) ?? null;
  const reviewCount = toNumberOrUndefined(doc.reviewCount) ?? null;

  // 追加：必須フィールド
  const views = typeof doc.views === "number" ? (doc.views as number) : 0;
  const createdAtISO = toISO(doc.createdAt) || new Date().toISOString();
  const updatedAtISO = toISO(doc.updatedAt) || createdAtISO;

  const product: ProductType = {
    id: toStringOr(doc.id),
    productName: toStringOr(doc.productName ?? doc.itemName, ""),
    imageUrl: toStringOr(doc.imageUrl, "/no-image.png"),

    // ProductType.price が number のため 0 をフォールバック
    price: priceMaybe ?? 0,
    itemPrice: priceMaybe, // optional なら undefined でもOK

    tags: Array.isArray(doc.tags)
      ? (doc.tags as unknown[]).map((t) =>
          typeof t === "string" ? t : String(t)
        )
      : [],

    category: toStringOr(doc.category, ""),
    capacity: toNumberOrUndefined(doc.capacity),
    outputPower: toNumberOrUndefined(doc.outputPower),
    hasTypeC: Boolean(doc.hasTypeC),
    affiliateUrl: toStringOr(doc.affiliateUrl, ""),

    // ★ バッジ用
    inStock,
    reviewAverage,
    reviewCount,
    priceHistory,

    // ★ ProductType で必須の3つ
    views,
    createdAt: createdAtISO,
    updatedAt: updatedAtISO,
  };

  return product;
}
