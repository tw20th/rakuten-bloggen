// app/tags/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { parseTagKey, TAGS, type TagKey } from "../tagConfig";
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl";
import type { Offer } from "@/types/monitoredItem";
import type { PriceHistoryEntry } from "@/types/product";
import { primaryOffer, offerBySource } from "@/utils/offers";

export const dynamic = "force-dynamic";

// ------------- helpers -----------------
type FirestoreTsLike = { toDate: () => Date };
const isFsTs = (v: unknown): v is FirestoreTsLike =>
  typeof v === "object" &&
  v !== null &&
  "toDate" in (v as Record<string, unknown>) &&
  typeof (v as FirestoreTsLike).toDate === "function";

const toDateFromUnknown = (v: unknown): Date | null => {
  if (!v) return null;
  if (isFsTs(v)) return v.toDate();
  const d = new Date(String(v));
  return Number.isNaN(d.getTime()) ? null : d;
};

const normalizePriceHistory = (raw: unknown): PriceHistoryEntry[] => {
  if (!Array.isArray(raw)) return [];
  const out: PriceHistoryEntry[] = [];
  for (const e of raw) {
    const priceRaw = (e as Record<string, unknown>)?.price;
    const dateRaw = (e as Record<string, unknown>)?.date;
    const price =
      typeof priceRaw === "number"
        ? priceRaw
        : typeof priceRaw === "string"
        ? Number(priceRaw)
        : NaN;
    const d = toDateFromUnknown(dateRaw);
    const date = d
      ? d.toISOString()
      : typeof dateRaw === "string"
      ? dateRaw
      : "";
    if (Number.isFinite(price) && date) out.push({ price, date });
  }
  return out;
};

const isOffer = (v: unknown): v is Offer => {
  if (typeof v !== "object" || v === null) return false;
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
// ---------------------------------------

type ProductCard = {
  id: string;
  productName: string;
  imageUrl: string;
  price?: number;
  affiliateUrl?: string;
  priceHistory?: PriceHistoryEntry[];
  reviewAverage?: number;
  reviewCount?: number;
  inStock?: boolean;
  restockedAt?: unknown;
};

export async function generateMetadata({
  params,
}: {
  params: { slug: string };
}) {
  const key = parseTagKey(params.slug);
  if (!key) return { title: "見つかりませんでした | ChargeScope" };
  const t = TAGS[key];
  return {
    title: `${t.label}のモバイルバッテリー | ChargeScope`,
    description: t.description,
  };
}

export default async function TagPage({
  params,
}: {
  params: { slug: string };
}) {
  const key: TagKey | undefined = parseTagKey(params.slug);
  if (!key) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <h1 className="text-xl font-semibold">ページが見つかりません</h1>
        <p className="mt-2 text-slate-600">
          指定されたタグは存在しないようです。
        </p>
      </main>
    );
  }

  const tag = TAGS[key].firestoreTag;

  const snap = await dbAdmin
    .collection("monitoredItems")
    .where("tags", "array-contains", tag)
    .orderBy("createdAt", "desc")
    .limit(48)
    .get();

  const items: ProductCard[] = snap.docs.map((d) => {
    const data = d.data() as Record<string, unknown>;

    // offers 優先で価格/URLを決定
    const offers = readOffers((data as { offers?: unknown }).offers);
    const pOffer = primaryOffer(offers);
    const rakuten = offerBySource(offers, "rakuten");
    const price =
      typeof pOffer?.price === "number"
        ? pOffer.price
        : typeof data.price === "number"
        ? (data.price as number)
        : typeof (data as { itemPrice?: unknown }).itemPrice === "number"
        ? ((data as { itemPrice?: number }).itemPrice as number)
        : undefined;

    const affiliateUrl =
      rakuten?.url ??
      (typeof data.affiliateUrl === "string"
        ? (data.affiliateUrl as string)
        : undefined) ??
      pOffer?.url;

    return {
      id: d.id,
      productName:
        (typeof data.productName === "string" ? data.productName : undefined) ??
        (typeof (data as { displayName?: unknown }).displayName === "string"
          ? ((data as { displayName?: string }).displayName as string)
          : "名称不明"),
      imageUrl: (typeof data.imageUrl === "string"
        ? data.imageUrl
        : "") as string,
      price,
      affiliateUrl,
      priceHistory: normalizePriceHistory(
        (data as { priceHistory?: unknown }).priceHistory
      ),
      reviewAverage:
        typeof data.reviewAverage === "number"
          ? (data.reviewAverage as number)
          : undefined,
      reviewCount:
        typeof data.reviewCount === "number"
          ? (data.reviewCount as number)
          : undefined,
      inStock:
        typeof data.inStock === "boolean"
          ? (data.inStock as boolean)
          : undefined,
      restockedAt:
        (data as { restockedAt?: unknown }).restockedAt ??
        (data as { stockRestockedAt?: unknown }).stockRestockedAt,
    };
  });

  const tdef = TAGS[key];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      <header className="space-y-2">
        <h1 className="text-2xl font-semibold">
          {tdef.label}のモバイルバッテリー
        </h1>
        <p className="text-slate-600">{tdef.description}</p>
      </header>

      {items.length === 0 ? (
        <p className="text-slate-600">該当の商品が見つかりませんでした。</p>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {items.map((p) => {
            const img = p.imageUrl
              ? upgradeRakutenImageUrl(p.imageUrl, 600)
              : "/no-image.png";
            return (
              <div key={p.id} className="group">
                <Link href={`/product/${p.id}`}>
                  <div className="relative aspect-square overflow-hidden rounded-xl border bg-white">
                    <Image
                      src={img}
                      alt={p.productName}
                      fill
                      style={{ objectFit: "contain" }}
                      sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 16vw"
                      className="transition-transform group-hover:scale-105"
                    />
                    {typeof p.price === "number" && (
                      <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium">
                        ¥{p.price.toLocaleString()}
                      </div>
                    )}
                  </div>
                </Link>

                <Link href={`/product/${p.id}`}>
                  <p className="mt-2 line-clamp-2 text-sm">{p.productName}</p>
                </Link>

                {p.affiliateUrl && (
                  <a
                    href={p.affiliateUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-2 inline-block w-full text-center px-3 py-1 text-sm rounded-md bg-black text-white hover:bg-gray-800"
                  >
                    最安へ
                  </a>
                )}
              </div>
            );
          })}
        </div>
      )}

      <section className="mt-8 space-y-3">
        <h2 className="text-lg font-semibold">関連記事・ランキング</h2>
        <ul className="list-disc pl-5 text-sm text-slate-700 space-y-1">
          <li>
            <Link href={`/blog?tag=${encodeURIComponent(tdef.firestoreTag)}`}>
              {tdef.label}の選び方ガイド
            </Link>
          </li>
          <li>
            <Link
              href={`/ranking?tag=${encodeURIComponent(tdef.firestoreTag)}`}
            >
              {tdef.label}ランキングTOP5
            </Link>
          </li>
        </ul>
      </section>
    </main>
  );
}
