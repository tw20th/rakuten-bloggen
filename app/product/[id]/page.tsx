// app/product/[id]/page.tsx

export const dynamic = "force-dynamic"; // ← ✨これも必ず追加！

import { db } from "@/lib/firebase";
import { notFound } from "next/navigation";
import { PriceChart } from "@/components/product/PriceChart";
import type { MonitoredItemDoc, MonitoredItem } from "@/types/monitoredItem";

type Props = {
  params: { id: string };
};

export default async function ProductDetailPage({ params }: Props) {
  // firebase-admin で取得
  const snap = await db.collection("monitoredItems").doc(params.id).get();

  if (!snap.exists) return notFound();

  const data = snap.data() as MonitoredItemDoc;

  // Timestamp を number（ms）にしておく（UIで未使用でも安全のため）
  const item: MonitoredItem = {
    id: snap.id,
    productName: data.productName,
    imageUrl: data.imageUrl,
    price: data.price,
    capacity: data.capacity,
    outputPower: data.outputPower,
    weight: data.weight,
    hasTypeC: data.hasTypeC,
    tags: data.tags ?? [],
    featureHighlights: data.featureHighlights ?? [],
    aiSummary: data.aiSummary ?? "",
    priceHistory: data.priceHistory ?? [],
    affiliateUrl: data.affiliateUrl,
    createdAt: data.createdAt ? data.createdAt.toMillis() : null,
    updatedAt: data.updatedAt ? data.updatedAt.toMillis() : null,
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      {/* 商品タイトル・画像・価格 */}
      <div className="flex flex-col items-center text-center">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={item.imageUrl}
          alt={item.productName}
          className="w-64 h-auto rounded-xl mb-4"
        />
        <h1 className="text-2xl font-bold">{item.productName}</h1>
        <p className="text-xl text-green-600 mt-2">
          ¥{item.price.toLocaleString()}
        </p>
        <a
          href={item.affiliateUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center rounded-md border px-4 py-2 text-sm font-medium mt-4 hover:bg-gray-50"
        >
          楽天で詳細を見る
        </a>
      </div>

      {/* スペック表示（存在する場合のみ） */}
      <div className="mt-8 space-y-2">
        <h2 className="text-lg font-semibold">スペック</h2>
        <ul className="list-disc pl-5 text-sm">
          {item.capacity !== undefined && <li>容量: {item.capacity} mAh</li>}
          {item.outputPower !== undefined && (
            <li>出力: {item.outputPower} W</li>
          )}
          {item.weight !== undefined && <li>重さ: {item.weight} g</li>}
          {item.hasTypeC !== undefined && (
            <li>Type-C対応: {item.hasTypeC ? "あり" : "なし"}</li>
          )}
        </ul>
      </div>

      {/* タグ */}
      {item.tags.length > 0 && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">特徴タグ</h2>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded border px-2 py-0.5 text-xs"
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* 特徴ハイライト */}
      {Array.isArray(item.featureHighlights) &&
        item.featureHighlights.length > 0 && (
          <div className="mt-6">
            <h2 className="text-lg font-semibold mb-2">特徴</h2>
            <ul className="list-disc pl-5 text-sm space-y-1">
              {item.featureHighlights.map((f, idx) => (
                <li key={idx}>{f}</li>
              ))}
            </ul>
          </div>
        )}

      {/* AI要約 */}
      {item.aiSummary && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold mb-2">要約</h2>
          <p className="text-sm whitespace-pre-wrap">{item.aiSummary}</p>
        </div>
      )}

      {/* 価格推移グラフ */}
      {item.priceHistory.length > 0 && (
        <div className="mt-8">
          <h2 className="text-lg font-semibold mb-2">価格推移</h2>
          <PriceChart data={item.priceHistory} />
        </div>
      )}
    </div>
  );
}
