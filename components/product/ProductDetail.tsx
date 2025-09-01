// components/product/ProductDetail.tsx
import Image from "next/image";
import Link from "next/link";
import type { ProductType } from "@/types/product";
import type { BlogType } from "@/types/blog";
import type { Offer } from "@/types/monitoredItem";
import { PriceChart } from "./PriceChart";
import { TagBadge } from "@/components/common/TagBadge";
import { BlogCard } from "@/components/blog/BlogCard";
import { formatPrice } from "@/lib/utils/formatPrice";
import { primaryOffer, offerBySource } from "@/utils/offers";

type Props = {
  product: ProductType & {
    offers?: Offer[];
    amazonAffiliateUrl?: string | null;
    rakutenAffiliateUrl?: string | null;
  };
  relatedBlogs?: BlogType[];
};

export default function ProductDetail({ product, relatedBlogs }: Props) {
  const {
    productName,
    imageUrl,
    price,
    aiSummary,
    featureHighlights,
    tags,
    category,
    capacity,
    outputPower,
    weight,
    hasTypeC,
    priceHistory,
    affiliateUrl,
    offers,
  } = product;

  // --- offers 優先の表示値＆CTA
  const pOffer = primaryOffer(offers);
  const displayPrice = typeof pOffer?.price === "number" ? pOffer.price : price;
  const amazonUrl =
    offerBySource(offers, "amazon")?.url ?? product.amazonAffiliateUrl ?? null;
  const rakutenUrl =
    offerBySource(offers, "rakuten")?.url ??
    product.rakutenAffiliateUrl ??
    (affiliateUrl?.includes("rakuten") ? affiliateUrl : null);

  const summary =
    (aiSummary && aiSummary.trim().length > 0
      ? aiSummary
      : featureHighlights?.join(" / ")) ?? "";

  return (
    <article className="space-y-8">
      {/* Hero */}
      <header className="grid grid-cols-1 md:grid-cols-[320px_1fr] gap-6 items-start">
        <div className="relative aspect-square w-full max-w-[320px] mx-auto md:mx-0">
          <Image
            src={imageUrl}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, 320px"
            className="object-contain rounded-2xl border"
            priority
          />
        </div>

        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-semibold">{productName}</h1>
          <div className="flex flex-wrap items-center gap-2">
            {tags?.map((t) => (
              <TagBadge key={t} label={t} />
            ))}
            {category && (
              <span className="text-sm text-gray-500">/ {category}</span>
            )}
          </div>

          <div className="flex items-baseline gap-3">
            <div className="text-3xl font-bold">
              {typeof displayPrice === "number" && displayPrice > 0
                ? formatPrice(displayPrice)
                : "—"}
            </div>
            <span className="text-sm text-gray-500">税込・参考</span>
          </div>

          {(rakutenUrl || amazonUrl || affiliateUrl) && (
            <div className="flex gap-2 flex-wrap">
              {rakutenUrl && (
                <Link
                  href={rakutenUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg px-4 py-2 bg-gray-900 text-white hover:opacity-90 transition"
                >
                  楽天で価格・在庫を見る
                </Link>
              )}
              {amazonUrl && (
                <Link
                  href={amazonUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg px-4 py-2 border hover:bg-gray-50 transition"
                >
                  Amazonで見る
                </Link>
              )}
              {!rakutenUrl && !amazonUrl && affiliateUrl && (
                <Link
                  href={affiliateUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center rounded-lg px-4 py-2 bg-gray-900 text-white hover:opacity-90 transition"
                >
                  最安値を今すぐチェック
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      {/* 要約 */}
      {summary && (
        <section className="space-y-2">
          <h2 className="text-xl font-semibold">この商品のポイント</h2>
          <p className="text-gray-700 leading-relaxed">{summary}</p>
        </section>
      )}

      {/* 価格推移 */}
      {priceHistory?.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">価格推移</h2>
          <div className="rounded-2xl border p-4">
            <PriceChart priceHistory={priceHistory} />
          </div>
        </section>
      )}

      {/* スペック */}
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">主なスペック</h2>
        <div className="overflow-x-auto">
          <table className="min-w-[480px] w-full text-sm">
            <tbody className="[&>tr:nth-child(odd)]:bg-gray-50">
              {typeof capacity === "number" && (
                <tr>
                  <th className="w-40 text-left px-3 py-2 text-gray-500">
                    容量
                  </th>
                  <td className="px-3 py-2">{capacity.toLocaleString()} mAh</td>
                </tr>
              )}
              {typeof outputPower === "number" && (
                <tr>
                  <th className="w-40 text-left px-3 py-2 text-gray-500">
                    出力
                  </th>
                  <td className="px-3 py-2">{outputPower} W</td>
                </tr>
              )}
              {typeof weight === "number" && (
                <tr>
                  <th className="w-40 text-left px-3 py-2 text-gray-500">
                    重さ
                  </th>
                  <td className="px-3 py-2">{weight} g</td>
                </tr>
              )}
              {typeof hasTypeC === "boolean" && (
                <tr>
                  <th className="w-40 text-left px-3 py-2 text-gray-500">
                    Type-C 対応
                  </th>
                  <td className="px-3 py-2">{hasTypeC ? "はい" : "いいえ"}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* 関連ブログ */}
      {relatedBlogs && relatedBlogs.length > 0 && (
        <section className="space-y-3">
          <h2 className="text-xl font-semibold">関連ブログ記事</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {relatedBlogs.map((b) => (
              <BlogCard key={b.slug} blog={b} />
            ))}
          </div>
        </section>
      )}
    </article>
  );
}
