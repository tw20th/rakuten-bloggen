import { dbAdmin } from "@/lib/firebaseAdmin";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { productJsonLd, type SimpleOffer } from "@/lib/seo/jsonld";
import { computeBadges } from "@/utils/badges";
import { BackLink } from "@/components/common/BackLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { AffiliateCTA } from "@/components/product/AffiliateCTA";
// 画像改善
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl";

// このページだけで amazon/rakuten の拡張フィールドを扱えるように型を拡張
type ProductWithAff = ProductType & {
  amazonAffiliateUrl?: string | null;
  rakutenAffiliateUrl?: string | null;
};

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const snap = await dbAdmin.collection("monitoredItems").doc(params.id).get();
  if (!snap.exists) {
    return <div className="p-6 text-red-500">商品が見つかりませんでした。</div>;
  }

  const data = snap.data()!;
  const product = convertToProduct({
    id: params.id,
    ...data,
  }) as ProductWithAff;

  const badges = computeBadges({
    currentPrice: typeof product.price === "number" ? product.price : undefined,
    history: product.priceHistory ?? [],
    inStock: product.inStock ?? undefined,
    reviewAverage: product.reviewAverage ?? undefined,
    reviewCount: product.reviewCount ?? undefined,
  });

  const offersFromDoc: SimpleOffer[] | undefined = Array.isArray(
    (data as { offers?: SimpleOffer[] }).offers
  )
    ? (data as { offers?: SimpleOffer[] }).offers
    : undefined;

  const fallbackSingleOffer: SimpleOffer[] =
    typeof product.itemPrice === "number" && !!product.affiliateUrl
      ? [{ price: product.itemPrice, url: product.affiliateUrl }]
      : [];

  const jsonLd = productJsonLd({
    ...product,
    offers:
      offersFromDoc && offersFromDoc.length > 0
        ? offersFromDoc
        : fallbackSingleOffer,
  });

  const crumbs = [
    { href: "/", label: "ホーム" },
    { href: "/product", label: "商品一覧" },
    ...(product.category
      ? [
          {
            href: `/product?tag=${encodeURIComponent(product.category)}`,
            label: product.category,
          },
        ]
      : []),
    { href: `/product/${product.id}`, label: product.productName },
  ];

  const badgeClass = (t: (typeof badges)[number]["type"]) => {
    const map: Record<string, string> = {
      "price-drop":
        "bg-green-100 text-green-700 px-2 py-0.5 text-xs rounded-full",
      "lowest-update":
        "bg-blue-100 text-blue-700 px-2 py-0.5 text-xs rounded-full",
      "high-rating":
        "bg-yellow-100 text-yellow-700 px-2 py-0.5 text-xs rounded-full",
      restock: "bg-amber-100 text-amber-700 px-2 py-0.5 text-xs rounded-full",
    };
    return (
      map[t] ?? "bg-gray-100 text-gray-700 px-2 py-0.5 text-xs rounded-full"
    );
  };

  const hist = (product.priceHistory ?? [])
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const pastPrices = hist.map((h) => h.price);
  const minPast = pastPrices.length > 0 ? Math.min(...pastPrices) : undefined;
  const avgPast =
    pastPrices.length > 0
      ? Math.round(pastPrices.reduce((s, v) => s + v, 0) / pastPrices.length)
      : undefined;

  // 高解像度画像URL（無ければ空→fallbackでno-image）
  const imgHi = product.imageUrl
    ? upgradeRakutenImageUrl(product.imageUrl, 1000)
    : "";

  // ▼ ボタン用URLの決定（存在すれば表示）
  const rakutenUrl =
    product.rakutenAffiliateUrl ??
    (product.affiliateUrl?.includes("rakuten") ? product.affiliateUrl : null);

  const amazonUrl = product.amazonAffiliateUrl ?? null;

  return (
    <main className="max-w-4xl mx-auto p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <Breadcrumbs items={crumbs} />
      <div className="mb-4">
        <BackLink label="商品一覧へ戻る" />
      </div>

      <h1 className="text-2xl font-bold mb-2">{product.productName}</h1>

      {/* バッジ */}
      {badges.length > 0 && (
        <div className="mb-4 flex flex-wrap gap-2">
          {badges.map((b, i) => (
            <span key={`${b.type}-${i}`} className={badgeClass(b.type)}>
              {b.label}
            </span>
          ))}
        </div>
      )}

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          {/* 正方形エリアでボケないように contain */}
          <div className="relative w-full aspect-square bg-white rounded-lg shadow">
            <Image
              src={imgHi || "/no-image.png"}
              alt={product.productName}
              fill
              style={{ objectFit: "contain" }}
              sizes="(max-width: 768px) 100vw, 512px"
              priority
            />
          </div>
        </div>

        <div className="w-full md:w-1/2 space-y-2 text-base">
          <p>
            <strong>価格:</strong>{" "}
            {typeof product.price === "number" && product.price > 0
              ? `¥${product.price.toLocaleString()}`
              : "ー"}
          </p>

          {/* 価格補助行 */}
          {typeof product.price === "number" &&
            (minPast !== undefined || avgPast !== undefined) && (
              <p className="text-sm text-gray-600">
                {minPast !== undefined &&
                  (product.price <= minPast
                    ? "過去最安値です"
                    : `過去最安: ¥${minPast.toLocaleString()}`)}
                {avgPast !== undefined && (
                  <>
                    {minPast !== undefined ? " / " : ""}
                    平均比: {Math.sign(product.price - avgPast) < 0 ? "−" : "+"}
                    {Math.abs(
                      Math.round(((product.price - avgPast) / avgPast) * 100)
                    )}
                    %
                  </>
                )}
              </p>
            )}

          <p>
            <strong>容量:</strong>{" "}
            {typeof product.capacity === "number"
              ? `${product.capacity} mAh`
              : "ー"}
          </p>
          <p>
            <strong>出力:</strong>{" "}
            {typeof product.outputPower === "number"
              ? `${product.outputPower} W`
              : "ー"}
          </p>
          <p>
            <strong>Type-C対応:</strong> {product.hasTypeC ? "はい" : "いいえ"}
          </p>

          {Array.isArray(product.tags) && product.tags.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <Link
                  key={t}
                  href={`/product?tag=${encodeURIComponent(t)}`}
                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 px-2 py-1 text-sm rounded-full"
                >
                  #{t}
                </Link>
              ))}
            </div>
          )}

          {Array.isArray(product.featureHighlights) &&
            product.featureHighlights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.featureHighlights.map((f) => (
                  <span
                    key={f}
                    className="bg-blue-100 text-blue-700 px-2 py-1 text-sm rounded-full"
                  >
                    {f}
                  </span>
                ))}
              </div>
            )}

          {/* ▼ CTA：楽天 / Amazon を並べて表示（どちらか一方だけでもOK） */}
          {(rakutenUrl || amazonUrl || product.affiliateUrl) && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rakutenUrl && (
                <AffiliateCTA
                  href={rakutenUrl}
                  itemId={product.id}
                  itemName={product.productName}
                  price={
                    typeof product.price === "number"
                      ? product.price
                      : undefined
                  }
                  label="楽天で見る"
                />
              )}

              {amazonUrl && (
                <AffiliateCTA
                  href={amazonUrl}
                  itemId={product.id}
                  itemName={product.productName}
                  price={
                    typeof product.price === "number"
                      ? product.price
                      : undefined
                  }
                  label="Amazonで見る"
                />
              )}

              {/* どちらも無ければ従来の affiliateUrl を1ボタンで */}
              {!rakutenUrl && !amazonUrl && product.affiliateUrl && (
                <AffiliateCTA
                  href={product.affiliateUrl}
                  itemId={product.id}
                  itemName={product.productName}
                  price={
                    typeof product.price === "number"
                      ? product.price
                      : undefined
                  }
                  label="最安値を今すぐチェック"
                />
              )}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
