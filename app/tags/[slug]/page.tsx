// app/tags/[slug]/page.tsx
import Image from "next/image";
import Link from "next/link";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { parseTagKey, TAGS, type TagKey } from "../tagConfig";
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl";
import type { PriceHistoryEntry } from "@/types/product";

export const dynamic = "force-dynamic";

// -------- helpers ----------------------------------------------------------
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

const isRecent = (v: unknown, days = 7): boolean => {
  const d = toDateFromUnknown(v);
  if (!d) return false;
  return Date.now() - d.getTime() <= days * 24 * 60 * 60 * 1000;
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

    if (Number.isFinite(price) && date) {
      // PriceHistoryEntry は { price: number; date: string } の想定
      out.push({ price, date });
    }
  }
  return out;
};

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

const computeBadges = (p: ProductCard) => {
  const badges: string[] = [];

  const ph = Array.isArray(p.priceHistory) ? p.priceHistory : [];
  if (ph.length >= 2) {
    const last = ph[ph.length - 1]?.price;
    const prev = ph[ph.length - 2]?.price;
    if (typeof last === "number" && typeof prev === "number" && last < prev) {
      badges.push("値下げしました");
    }
  }

  if (p.inStock === true && isRecent(p.restockedAt, 7)) {
    badges.push("在庫復活");
  }

  if (
    typeof p.reviewAverage === "number" &&
    typeof p.reviewCount === "number" &&
    p.reviewAverage >= 4.5 &&
    p.reviewCount >= 50
  ) {
    badges.push("高評価 4.5★以上");
  }

  return badges;
};

// -------- page -------------------------------------------------------------
type Params = { slug: string };

export async function generateMetadata({ params }: { params: Params }) {
  const key = parseTagKey(params.slug);
  if (!key) {
    return { title: "見つかりませんでした | ChargeScope" };
  }
  const t = TAGS[key];
  return {
    title: `${t.label}のモバイルバッテリー | ChargeScope`,
    description: t.description,
  };
}

export default async function TagPage({ params }: { params: Params }) {
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
    const data = d.data();
    return {
      id: d.id,
      productName: (data.productName ??
        data.displayName ??
        "名称不明") as string,
      imageUrl: (data.imageUrl ?? "") as string,
      price: (data.itemPrice ?? data.price ?? undefined) as number | undefined,
      affiliateUrl: (data.affiliateUrl ?? "") as string,
      priceHistory: normalizePriceHistory(data.priceHistory),
      reviewAverage: (data.reviewAverage ?? undefined) as number | undefined,
      reviewCount: (data.reviewCount ?? undefined) as number | undefined,
      inStock: (data.inStock ?? undefined) as boolean | undefined,
      restockedAt: (data.restockedAt ??
        data.stockRestockedAt ??
        undefined) as unknown,
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
            const badges = computeBadges(p);
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
                    <div className="absolute top-2 left-2 flex flex-col gap-1">
                      {badges.slice(0, 2).map((b) => (
                        <span
                          key={b}
                          className="rounded bg-black/80 text-white text-[10px] px-2 py-1"
                        >
                          {b}
                        </span>
                      ))}
                    </div>
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

      {/* 内部リンク */}
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
