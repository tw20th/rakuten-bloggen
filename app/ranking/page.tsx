import Link from "next/link";
import { dbAdmin } from "@/lib/firebaseAdmin";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import type { PriceHistoryEntry } from "@/types/monitoredItem";
import ProductCard from "@/components/product/ProductCard";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import SortControlProduct from "@/components/common/SortControlProduct";
import {
  parseProductSortKey,
  productSortToFirestore,
  type ProductSortKey,
} from "@/utils/sort";

export const dynamic = "force-dynamic";

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
  const price = priceFromPrice ?? priceFromItemPrice ?? 0;

  return {
    ...p,
    imageUrl: typeof p.imageUrl === "string" ? p.imageUrl : "",
    price,
    tags,
    priceHistory,
  };
}

type Props = { searchParams?: { sort?: ProductSortKey } };

export default async function RankingPage({ searchParams }: Props) {
  const sortKey = parseProductSortKey(searchParams?.sort);
  const { field, direction } = productSortToFirestore(sortKey);

  const col = dbAdmin.collection("monitoredItems");
  const snapshot = await col.orderBy(field, direction).limit(24).get();

  const rawProducts: ProductType[] = snapshot.docs.map((doc) =>
    convertToProduct({ id: doc.id, ...doc.data() })
  );
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
        {/* 並び替え（クライアント完結） */}
        <SortControlProduct />
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
