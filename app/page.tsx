// app/page.tsx
import Link from "next/link";
import Image from "next/image";
import { dbAdmin } from "@/lib/firebaseAdmin";
import type { ProductType } from "@/types/product";

export const dynamic = "force-dynamic";

export default async function Home() {
  // 新着商品 6件
  const productSnap = await dbAdmin
    .collection("monitoredItems")
    .orderBy("createdAt", "desc")
    .limit(6)
    .get();

  const products = productSnap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      productName: data.productName ?? data.displayName ?? "名称不明",
      imageUrl: data.imageUrl,
      itemPrice: data.itemPrice ?? data.price ?? null,
      affiliateUrl: data.affiliateUrl ?? "",
      tags: data.tags ?? [],
    } satisfies Partial<ProductType> & { id: string };
  });

  // 人気ブログ 3件（views降順）
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

  const tags = ["大容量", "軽量", "急速充電", "Type-C", "PD対応"];

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

      {/* 新着商品 */}
      <section className="space-y-4">
        <div className="flex items-baseline justify-between">
          <h2 className="text-xl font-semibold">新着</h2>
          <Link href="/product" className="text-sm text-slate-600 underline">
            すべて見る
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
          {products.map((p) => (
            <Link key={p.id} href={`/product/${p.id}`} className="group">
              <div className="aspect-square overflow-hidden rounded-xl border">
                {p.imageUrl && (
                  <Image
                    src={p.imageUrl}
                    alt={p.productName ?? ""}
                    width={300}
                    height={300}
                    className="w-full h-full object-contain transition-transform group-hover:scale-105"
                  />
                )}
              </div>
              <p className="mt-2 line-clamp-2 text-sm">{p.productName}</p>
            </Link>
          ))}
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
          {tags.map((t) => (
            <Link
              key={t}
              href={`/product?tag=${encodeURIComponent(t)}`}
              className="px-3 py-1 rounded-full border text-sm"
            >
              #{t}
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}
