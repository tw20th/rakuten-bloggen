// utils/convertToProduct.ts
import type { ProductType } from "@/types/product";
import type { Offer } from "@/types/monitoredItem";

// 任意オブジェクト判定
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

// Firestore Timestamp ライク型ガード（any不使用）
type TimestampLike = { toDate: () => Date };
function isTimestampLike(d: unknown): d is TimestampLike {
  if (!isRecord(d)) return false;
  const m = d as Record<string, unknown>;
  return typeof m.toDate === "function";
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
const toNumberOrUndefined = (v: unknown): number | undefined =>
  typeof v === "number" && Number.isFinite(v) ? v : undefined;
const toStringOr = (v: unknown, fallback = ""): string =>
  typeof v === "string" ? v : fallback;
const toBooleanOrNull = (v: unknown): boolean | null =>
  typeof v === "boolean" ? v : null;

// 任意キーのstringプロパティ取得（any不使用）
function getStringProp(o: unknown, key: string): string | undefined {
  if (!isRecord(o)) return undefined;
  const v = o[key];
  return typeof v === "string" ? v : undefined;
}

// --- offers 抽出 ------------------------------------------------------------
const isOffer = (v: unknown): v is Offer => {
  if (!isRecord(v)) return false;
  const r = v as Record<string, unknown>;
  return (
    typeof r.source === "string" &&
    typeof r.price === "number" &&
    typeof r.url === "string" &&
    typeof r.fetchedAt === "string"
  );
};
const readOffers = (raw: unknown): Offer[] =>
  Array.isArray(raw) ? (raw.filter(isOffer) as Offer[]) : [];

const PRIORITY: Record<Offer["source"], number> = {
  amazon: 0,
  rakuten: 1,
  yahoo: 2,
};
const pickPrimaryOffer = (offers: Offer[]): Offer | null =>
  offers.length
    ? [...offers].sort(
        (a, b) =>
          PRIORITY[a.source] - PRIORITY[b.source] ||
          new Date(b.fetchedAt).getTime() - new Date(a.fetchedAt).getTime()
      )[0] ?? null
    : null;
// ---------------------------------------------------------------------------

export function convertToProduct(doc: Record<string, unknown>): ProductType & {
  amazonAffiliateUrl?: string | null;
  rakutenAffiliateUrl?: string | null;
} {
  const offers = readOffers(
    isRecord(doc) ? (doc as { offers?: unknown }).offers : undefined
  );
  const pOffer = pickPrimaryOffer(offers);

  const priceMaybe =
    (typeof pOffer?.price === "number" ? pOffer.price : undefined) ??
    toNumberOrUndefined(doc.price) ??
    toNumberOrUndefined(doc.itemPrice);

  const historyRaw = Array.isArray(doc.priceHistory)
    ? (doc.priceHistory as Record<string, unknown>[])
    : [];
  const priceHistory = historyRaw
    .map((h) => {
      const dateISO = toISO(h?.date);
      const p = toNumberOrUndefined(h?.price);
      if (!dateISO || p === undefined) return null;
      return { date: dateISO, price: p };
    })
    .filter((x): x is { date: string; price: number } => x !== null);

  const inStock =
    toBooleanOrNull(doc.inStock) ??
    (typeof doc.availability === "number"
      ? (doc.availability as number) === 1
      : null);
  const reviewAverage = toNumberOrUndefined(doc.reviewAverage) ?? null;
  const reviewCount = toNumberOrUndefined(doc.reviewCount) ?? null;

  const views = typeof doc.views === "number" ? (doc.views as number) : 0;
  const createdAtISO = toISO(doc.createdAt) || new Date().toISOString();
  const updatedAtISO = toISO(doc.updatedAt) || createdAtISO;

  const amazonAffiliateUrl =
    toStringOr(doc.amazonAffiliateUrl ?? "", "") || null;
  const rakutenAffiliateUrl =
    toStringOr(doc.rakutenAffiliateUrl ?? "", "") || null;

  const product: ProductType & {
    amazonAffiliateUrl?: string | null;
    rakutenAffiliateUrl?: string | null;
  } = {
    id: toStringOr(doc.id),
    productName: toStringOr(
      doc.productName ?? getStringProp(doc, "itemName"),
      ""
    ),
    imageUrl: toStringOr(doc.imageUrl, "/no-image.png"),

    price: priceMaybe ?? 0,
    itemPrice: priceMaybe,

    tags: Array.isArray(doc.tags)
      ? (doc.tags as unknown[]).map((t) =>
          typeof t === "string" ? t : String(t)
        )
      : [],

    category: toStringOr(doc.category, ""),
    capacity: toNumberOrUndefined(doc.capacity),
    outputPower: toNumberOrUndefined(doc.outputPower),
    hasTypeC: Boolean(doc.hasTypeC),

    // offers優先
    affiliateUrl: (pOffer?.url ?? toStringOr(doc.affiliateUrl, "")) as string,

    inStock,
    reviewAverage,
    reviewCount,
    priceHistory,

    views,
    createdAt: createdAtISO,
    updatedAt: updatedAtISO,

    amazonAffiliateUrl,
    rakutenAffiliateUrl,
  };

  return product;
}
