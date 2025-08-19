// app/ranking/page.tsx
import Link from "next/link";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import type { PriceHistoryEntry } from "@/types/monitoredItem";
import ProductCard from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: { type?: "popular" | "cheap" | "newest" };
};

const TABS: Array<{
  key: NonNullable<Props["searchParams"]>["type"];
  label: string;
}> = [
  { key: "popular", label: "人気順" },
  { key: "cheap", label: "価格の安い順" },
  { key: "newest", label: "新着順" },
];

/** Timestamp ライク判定（Firestore Admin/Client両対応） */
function isTimestampLike(v: unknown): v is { toDate: () => Date } {
  return (
    !!v &&
    typeof v === "object" &&
    typeof (v as { toDate?: unknown }).toDate === "function"
  );
}
function toIso(v: unknown): string {
  if (isTimestampLike(v)) return v.toDate().toISOString();
  if (v instanceof Date) return v.toISOString();
  return typeof v === "string" ? v : "";
}
function toNumber(v: unknown): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    return Number.isFinite(n) ? n : undefined;
  }
  return undefined;
}
function normalizePriceHistory(v: unknown): PriceHistoryEntry[] {
  if (!Array.isArray(v)) return [];
  const out: PriceHistoryEntry[] = [];
  for (const row of v) {
    const date = toIso((row as { date?: unknown }).date);
    const price = toNumber((row as { price?: unknown }).price);
    if (date && typeof price === "number") out.push({ date, price });
  }
  return out;
}
/** Client Component に渡して安全な Product に整形 */
function toClientProduct(p: ProductType): ProductType {
  const priceHistory = normalizePriceHistory(
    (p as unknown as { priceHistory?: unknown }).priceHistory
  );

  const tagsUnknown = (p as unknown as { tags?: unknown }).tags;
  const tags = Array.isArray(tagsUnknown)
    ? tagsUnknown.filter((t): t is string => typeof t === "string")
    : [];

  const priceFromPrice = toNumber((p as unknown as { price?: unknown }).price);
  const priceFromItemPrice = toNumber(
    (p as unknown as { itemPrice?: unknown }).itemPrice
  );
  const price = priceFromPrice ?? priceFromItemPrice;

  return {
    ...p,
    imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : "",
    price: typeof price === "number" ? price : 0, // 必須なら0でフォールバック
    tags,
    priceHistory, // ← ここは必ず配列（[]含む）
  };
}

export default async function RankingPage({ searchParams }: Props) {
  const current = (searchParams?.type ?? "popular") as
    | "popular"
    | "cheap"
    | "newest";

  const col = dbAdmin.collection("monitoredItems");
  const query =
    current === "cheap"
      ? col.orderBy("price", "asc").limit(24)
      : current === "newest"
      ? col.orderBy("createdAt", "desc").limit(24)
      : col.orderBy("views", "desc").limit(24);

  const snapshot = await query.get();

  const rawProducts: ProductType[] = snapshot.docs.map((doc) =>
    convertToProduct({ id: doc.id, ...doc.data() })
  );

  // ★ クライアント安全に整形
  const products = rawProducts.map(toClientProduct);

  return (
    <main className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      <Breadcrumbs
        items={[
          { href: "/", label: "ホーム" },
          { href: "/ranking", label: "ランキング" },
        ]}
      />

      <header className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-2xl font-bold">ランキング</h1>
        <nav className="flex items-center gap-2 text-sm">
          {TABS.map((t) => {
            const href =
              t.key === "popular" ? "/ranking" : `/ranking?type=${t.key}`;
            const isActive =
              current === t.key || (!searchParams?.type && t.key === "popular");
            return (
              <Link
                key={t.key}
                href={href}
                className={`px-3 py-1 rounded-full border ${
                  isActive ? "bg-gray-900 text-white" : "hover:bg-gray-100"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </header>

      {products.length === 0 ? (
        <div className="text-center text-gray-500 py-12 space-y-3">
          <p>まだランキング対象の商品がありません。</p>
          <Link href="/product" className="text-blue-600 hover:underline">
            商品一覧へ
          </Link>
        </div>
      ) : (
        <section>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
