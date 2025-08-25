// components/product/ProductCard.tsx
"use client";

import type { ProductType } from "@/types/product";
import type { PriceHistoryEntry } from "@/types/monitoredItem";
import { Card, CardContent } from "@/components/ui/card";
import { Badge as UiBadge } from "@/components/ui/badge";
import Image from "next/image";
import Link from "next/link";
import { computeBadges } from "@/utils/badges";

type ProductWithHistory = ProductType & {
  priceHistory?: PriceHistoryEntry[];
  affiliateUrl?: string | null;
  inStock?: boolean | null; // ← ここを null 許容に
  reviewAverage?: number | null;
  reviewCount?: number | null;
};

type Props = { product: ProductWithHistory };

// ---- GA4 helper ------------------------------------------------------------
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}
const track = (event: string, params: Record<string, unknown>) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", event, params);
  }
};

const getAffiliateSource = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    if (host.includes("rakuten")) return "rakuten";
    if (host.includes("amazon")) return "amazon";
    if (host.includes("shopping.yahoo")) return "yahoo";
    return host; // fallback: ホスト名
  } catch {
    return undefined;
  }
};
// ----------------------------------------------------------------------------

export default function ProductCard({ product }: Props) {
  // --- バッジ ---
  const badges = computeBadges({
    currentPrice: typeof product.price === "number" ? product.price : undefined,
    history: product.priceHistory ?? [],
    inStock: product.inStock ?? undefined,
    reviewAverage: product.reviewAverage ?? undefined,
    reviewCount: product.reviewCount ?? undefined,
  });

  // --- 価格の補助情報（過去最安 / 平均比）---
  const hist = (product.priceHistory ?? [])
    .slice()
    .sort((a, b) => String(a.date).localeCompare(String(b.date)));
  const pastPrices = hist.map((h) => h.price);
  const minPast = pastPrices.length > 0 ? Math.min(...pastPrices) : undefined;
  const avgPast =
    pastPrices.length > 0
      ? Math.round(pastPrices.reduce((s, v) => s + v, 0) / pastPrices.length)
      : undefined;

  const priceNumber =
    typeof product.price === "number" && product.price > 0
      ? product.price
      : undefined;

  const handleCardClick = () => {
    track("product_card_click", {
      item_id: product.id,
      item_name: product.productName,
      price: priceNumber,
      list: "product_list",
    });
  };

  const handleAffiliateClick = () => {
    track("affiliate_click", {
      item_id: product.id,
      item_name: product.productName,
      price: priceNumber,
      affiliate_source: getAffiliateSource(product.affiliateUrl),
      value: 1,
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow duration-200">
      {/* カード全体を詳細ページへのリンクに */}
      <Link
        href={`/product/${product.id}`}
        className="block"
        onClick={handleCardClick}
        aria-label={`${product.productName} の詳細を見る`}
      >
        <div className="relative">
          <Image
            src={product.imageUrl}
            alt={product.productName}
            width={500}
            height={300}
            className="w-full h-48 object-contain p-4 bg-white"
          />
          {/* バッジ（画像の左上） */}
          {badges.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {badges.map((b, i) => (
                <span
                  key={`${b.type}-${i}`}
                  className={
                    b.type === "price-drop"
                      ? "bg-green-100 text-green-700 px-2 py-0.5 text-xs rounded-full"
                      : b.type === "lowest-update"
                      ? "bg-blue-100 text-blue-700 px-2 py-0.5 text-xs rounded-full"
                      : b.type === "high-rating"
                      ? "bg-yellow-100 text-yellow-700 px-2 py-0.5 text-xs rounded-full"
                      : "bg-amber-100 text-amber-700 px-2 py-0.5 text-xs rounded-full" // restock
                  }
                >
                  {b.label}
                </span>
              ))}
            </div>
          )}
        </div>

        <CardContent className="space-y-2 px-4 pb-3">
          <h2 className="text-base font-semibold line-clamp-2">
            {product.productName}
          </h2>

          <div className="text-lg font-bold text-red-600">
            {priceNumber ? `¥${priceNumber.toLocaleString()}` : "価格情報なし"}
          </div>

          {/* ▼ 価格補助（過去最安 / 平均比） */}
          {priceNumber && (minPast !== undefined || avgPast !== undefined) && (
            <p className="text-xs text-gray-600">
              {minPast !== undefined &&
                (priceNumber <= minPast
                  ? "過去最安"
                  : `過去最安: ¥${minPast.toLocaleString()}`)}
              {avgPast !== undefined && (
                <>
                  {minPast !== undefined ? " / " : ""}
                  平均比: {Math.sign(priceNumber - avgPast) < 0 ? "−" : "+"}
                  {Math.abs(
                    Math.round(((priceNumber - avgPast) / avgPast) * 100)
                  )}
                  %
                </>
              )}
            </p>
          )}

          <div className="flex flex-wrap gap-1">
            {(product.tags ?? []).slice(0, 3).map((tag) => (
              <UiBadge key={tag} className="text-xs" variant="outline">
                {tag}
              </UiBadge>
            ))}
          </div>
        </CardContent>
      </Link>

      {/* 外部リンクCTA（ある場合のみ表示） */}
      {product.affiliateUrl && (
        <div className="px-4 pb-4">
          <a
            href={product.affiliateUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={handleAffiliateClick}
            className="inline-flex items-center justify-center w-full rounded-xl border px-3 py-2 text-sm font-medium hover:bg-gray-50 transition"
            aria-label="最安値を今すぐチェック（外部サイト）"
          >
            最安値を今すぐチェック
          </a>
        </div>
      )}
    </Card>
  );
}
