// app/product/[id]/page.tsx
import { dbAdmin } from "@/lib/firebaseAdmin";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import type { Offer } from "@/types/monitoredItem";
import Image from "next/image";
import Link from "next/link";
import { productJsonLd, type SimpleOffer } from "@/lib/seo/jsonld";
import { computeBadges } from "@/utils/badges";
import { BackLink } from "@/components/common/BackLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { AffiliateCTA } from "@/components/product/AffiliateCTA";
import { upgradeRakutenImageUrl } from "@/utils/upgradeRakutenImageUrl";
import { primaryOffer, offerBySource } from "@/utils/offers";

type ProductWithAff = ProductType & {
  amazonAffiliateUrl?: string | null;
  rakutenAffiliateUrl?: string | null;
};

// --- 型ガード ---------------------------------------------------------------
const isRecord = (v: unknown): v is Record<string, unknown> =>
  typeof v === "object" && v !== null;

const isOffer = (v: unknown): v is Offer => {
  if (!isRecord(v)) return false;
  return (
    typeof v.source === "string" &&
    typeof v.price === "number" &&
    typeof v.url === "string" &&
    typeof v.fetchedAt === "string"
  );
};

const readOffers = (raw: unknown): Offer[] =>
  Array.isArray(raw) ? (raw.filter(isOffer) as Offer[]) : [];
// ---------------------------------------------------------------------------

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

  // --- offers を優先して表示値・CTAを決定 ---
  const offers: Offer[] = readOffers(
    isRecord(data) && "offers" in data
      ? (data as { offers?: unknown }).offers
      : undefined
  );
  const pOffer = primaryOffer(offers);
  const offerAmazon = offerBySource(offers, "amazon");
  const offerRakuten = offerBySource(offers, "rakuten");

  const displayPrice =
    typeof pOffer?.price === "number"
      ? pOffer.price
      : typeof product.price === "number"
      ? product.price
      : undefined;

  const amazonUrl = offerAmazon?.url ?? product.amazonAffiliateUrl ?? null;
  const rakutenUrl =
    offerRakuten?.url ??
    (product.affiliateUrl?.includes("rakuten") ? product.affiliateUrl : null);

  // JSON-LD：offers があれば優先
  const jsonLdOffers: SimpleOffer[] =
    offers.length > 0
      ? offers.map((o) => ({ price: o.price, url: o.url }))
      : typeof product.itemPrice === "number" && !!product.affiliateUrl
      ? [{ price: product.itemPrice, url: product.affiliateUrl }]
      : [];

  const jsonLd = productJsonLd({ ...product, offers: jsonLdOffers });

  const badges = computeBadges({
    currentPrice: displayPrice,
    history: product.priceHistory ?? [],
    inStock: product.inStock ?? undefined,
    reviewAverage: product.reviewAverage ?? undefined,
    reviewCount: product.reviewCount ?? undefined,
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

  const imgHi = product.imageUrl
    ? upgradeRakutenImageUrl(product.imageUrl, 1000)
    : "";

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
            {typeof displayPrice === "number" && displayPrice > 0
              ? `¥${displayPrice.toLocaleString()}`
              : "ー"}
          </p>

          {typeof displayPrice === "number" &&
            (minPast !== undefined || avgPast !== undefined) && (
              <p className="text-sm text-gray-600">
                {minPast !== undefined &&
                  (displayPrice <= minPast
                    ? "過去最安値です"
                    : `過去最安: ¥${minPast.toLocaleString()}`)}
                {avgPast !== undefined && (
                  <>
                    {minPast !== undefined ? " / " : ""}
                    平均比: {Math.sign(displayPrice - avgPast) < 0 ? "−" : "+"}
                    {Math.abs(
                      Math.round(((displayPrice - avgPast) / avgPast) * 100)
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

          {/* CTA：Amazon / 楽天（両方 or 片方 or 旧互換） */}
          {(rakutenUrl || amazonUrl || product.affiliateUrl) && (
            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
              {rakutenUrl && (
                <AffiliateCTA
                  href={rakutenUrl}
                  itemId={product.id}
                  itemName={product.productName}
                  price={displayPrice}
                  label="楽天で見る"
                />
              )}
              {amazonUrl && (
                <AffiliateCTA
                  href={amazonUrl}
                  itemId={product.id}
                  itemName={product.productName}
                  price={displayPrice}
                  label="Amazonで見る"
                />
              )}
              {!rakutenUrl && !amazonUrl && product.affiliateUrl && (
                <AffiliateCTA
                  href={product.affiliateUrl}
                  itemId={product.id}
                  itemName={product.productName}
                  price={displayPrice}
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
