// app/product/[id]/page.tsx
import { dbAdmin } from "@/lib/firebaseAdmin";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import Image from "next/image";
import Link from "next/link";
import { productJsonLd, type SimpleOffer } from "@/lib/seo/jsonld";

// ★ 追加：共通UI
import { BackLink } from "@/components/common/BackLink";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";

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
  const product: ProductType = convertToProduct({ id: params.id, ...data });

  // JSON-LD 用 offers（将来 offers[] が入れば自動で AggregateOffer へ）
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

  // パンくず：カテゴリがあれば差し込む（任意）
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

  return (
    <main className="max-w-4xl mx-auto p-6">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* ▼ パンくず＋戻る */}
      <Breadcrumbs items={crumbs} />
      <div className="mb-4">
        <BackLink label="商品一覧へ戻る" />
      </div>

      <h1 className="text-2xl font-bold mb-4">{product.productName}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <Image
            src={product.imageUrl || "/no-image.png"}
            alt={product.productName}
            width={400}
            height={400}
            className="rounded-lg shadow object-contain w-full h-auto bg-white"
          />
        </div>

        <div className="w-full md:w-1/2 space-y-2 text-base">
          <p>
            <strong>価格:</strong>{" "}
            {typeof product.price === "number"
              ? `¥${product.price.toLocaleString()}`
              : "ー"}
          </p>

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

          {/* タグ導線（存在時） */}
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

          {/* 特徴ハイライト（存在時） */}
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

          {product.affiliateUrl && (
            <div className="mt-4">
              <Link
                href={product.affiliateUrl}
                target="_blank"
                rel="sponsored nofollow noopener noreferrer"
                className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
              >
                🔗 楽天で見る
              </Link>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
