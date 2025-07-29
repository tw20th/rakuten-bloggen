// app/product/[id]/page.tsx
import { db } from "@/lib/firebase";
import { convertToProduct } from "@/utils/convertToProduct";
import type { ProductType } from "@/types/product";
import Image from "next/image";
import Link from "next/link";

export default async function ProductDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const snapshot = await db.collection("monitoredItems").doc(params.id).get();

  if (!snapshot.exists) {
    return <div className="p-6 text-red-500">商品が見つかりませんでした。</div>;
  }

  const itemData = snapshot.data();
  const product: ProductType = convertToProduct({ id: params.id, ...itemData });

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">{product.productName}</h1>

      <div className="flex flex-col md:flex-row gap-6">
        <div className="w-full md:w-1/2">
          <Image
            src={product.imageUrl}
            alt={product.productName}
            width={400}
            height={400}
            className="rounded-lg shadow"
          />
        </div>

        <div className="w-full md:w-1/2 space-y-2 text-base">
          <p>
            <strong>価格:</strong>{" "}
            {product.itemPrice
              ? `¥${product.itemPrice.toLocaleString()}`
              : "ー"}
          </p>
          <p>
            <strong>容量:</strong>{" "}
            {product.capacity ? `${product.capacity} mAh` : "ー"}
          </p>
          <p>
            <strong>出力:</strong>{" "}
            {product.outputPower ? `${product.outputPower} W` : "ー"}
          </p>
          <p>
            <strong>Type-C対応:</strong> {product.hasTypeC ? "はい" : "いいえ"}
          </p>

          {Array.isArray(product.featureHighlights) &&
            product.featureHighlights.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-2">
                {product.featureHighlights.map((feature) => (
                  <span
                    key={feature}
                    className="bg-blue-100 text-blue-700 px-2 py-1 text-sm rounded-full"
                  >
                    {feature}
                  </span>
                ))}
              </div>
            )}

          <div className="mt-4">
            <Link
              href={product.affiliateUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
            >
              🔗 楽天で見る
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}
