// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import type { Offer } from "@/types/monitoredItem";
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl";
import ConditionNav from "@/components/sections/ConditionNav";
import { TAG_ORDER, TAGS } from "@/app/tags/tagConfig";
import { primaryOffer, offerBySource } from "@/utils/offers";

export const dynamic = "force-dynamic";

// ---- price history 正規化だけユーティリティ ----
type PriceHistoryEntry = { date: string; price: number };
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
    const d = dateRaw ? new Date(String(dateRaw)) : null;
    const date =
      d && !Number.isNaN(d.getTime())
        ? d.toISOString()
        : typeof dateRaw === "string"
        ? dateRaw
        : "";
    if (Number.isFinite(price) && date) out.push({ price, date });
  }
  return out;
};

// ---- offers を安全に読むための型ガード ----
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isOffer = (v: unknown): v is Offer =>
  isRecord(v) &&
  typeof v.source === "string" &&
  typeof v.price === "number" &&
  typeof v.url === "string" &&
  typeof v.fetchedAt === "string";

const readOffers = (obj: unknown): Offer[] => {
  if (!isRecord(obj)) return [];
  const raw = (obj as { offers?: unknown }).offers;
  return Array.isArray(raw) ? raw.filter(isOffer) : [];
};

export default async function Home() {
  // 新着商品 6件
  const snap = await dbAdmin
    .collection("monitoredItems")
    .orderBy("createdAt", "desc")
    .limit(6)
    .get();

  // convertToProduct は affiliateUrl/price を offers 優先で整形してくれる
  const products: (ProductType & { priceHistory?: PriceHistoryEntry[] })[] =
    snap.docs.map((d) => {
      const base = convertToProduct({ id: d.id, ...d.data() });
      // JSON-LDやバッジ用に履歴だけ安全に整形
      return {
        ...base,
        priceHistory: normalizePriceHistory(
          (d.data() as { priceHistory?: unknown }).priceHistory
        ),
      };
    });

  // 人気ブログ 3件
  const blogSnap = await dbAdmin
    .collection("blogs")
    .where("status", "==", "published")
    .orderBy("views", "desc")
    .limit(3)
    .get();

  const blogs = blogSnap.docs.map((d) => ({ id: d.id, ...d.data() })) as {
    id: string;
    title: string;
    slug: string;
    imageUrl?: string;
    views?: number;
  }[];

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 space-y-10">
      {/* Hero */}
      <section className="rounded-2xl p-8 bg-gradient-to-br from-slate-50 to-white border">
        <h1 className="text-2xl sm:text-3xl font-semibold">
          モバイルバッテリーの最安と“ちょうどいい”を毎日更新
        </h1>
        <p className="mt-2 text-slate-600">
          比較して迷うところだけ要約。価格・在庫の変化も自動で追跡します。
        </p>
        <div className="mt-4 flex gap-3">
          <Link
            href="/product"
            className="px-4 py-2 rounded-xl bg-black text-white"
          >
            商品を探す
          </Link>
          <Link href="/blog" className="px-4 py-2 rounded-xl border">
            選び方ガイド
          </Link>
        </div>
      </section>

      {/* 条件から選ぶ */}
      <section>
        <ConditionNav />
      </section>

      {/* 新着商品 */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">新着</h2>
          <Link href="/product" className="text-sm text-slate-600 underline">
            すべて見る
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {products.map((p) => {
            const img = p.imageUrl
              ? upgradeRakutenImageUrl(p.imageUrl, 600)
              : "/no-image.png";

            // offers から最優先価格/リンクを再確認（convertToProduct 済みだが明示）
            const offers = readOffers(p);
            const po = primaryOffer(offers) ?? null;

            const price =
              typeof po?.price === "number"
                ? po.price
                : typeof p.price === "number" && p.price > 0
                ? p.price
                : undefined;

            const rakutenUrl =
              offerBySource(offers, "rakuten")?.url ??
              (p.affiliateUrl || undefined);

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
                      priority
                      className="transition-transform group-hover:scale-105"
                    />
                    {typeof price === "number" && (
                      <div className="absolute bottom-2 left-2 rounded-md bg-white/90 px-2 py-1 text-xs font-medium">
                        ¥{price.toLocaleString()}
                      </div>
                    )}
                  </div>
                </Link>

                <Link href={`/product/${p.id}`}>
                  <p className="mt-2 line-clamp-2 text-sm">{p.productName}</p>
                </Link>

                {rakutenUrl && (
                  <a
                    href={rakutenUrl}
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
      </section>

      {/* 人気ブログ */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">人気の読みもの</h2>
          <Link href="/blog" className="text-sm text-slate-600 underline">
            すべて見る
          </Link>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {blogs.map((b) => (
            <Link
              key={b.id}
              href={`/blog/${b.slug}`}
              className="block rounded-xl border p-4 hover:bg-slate-50"
            >
              <p className="font-medium line-clamp-2">{b.title}</p>
              <p className="text-xs text-slate-500 mt-2">
                {b.views ?? 0} views
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* タグ導線 */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">タグで探す</h2>
        <div className="flex flex-wrap gap-2">
          {TAG_ORDER.map((key) => {
            const t = TAGS[key];
            return (
              <Link
                key={t.key}
                href={`/tags/${t.key}`}
                className="px-3 py-1 rounded-full border text-sm"
              >
                #{t.label}
              </Link>
            );
          })}
        </div>
      </section>
    </main>
  );
}
