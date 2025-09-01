// lib/gtag.ts
export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID ?? "G-XXXXXXXXXX";

// GA4 の最低限の型
type GtagFunction = (...args: unknown[]) => void;

declare global {
  interface Window {
    gtag?: GtagFunction;
  }
}

// 型：リンクのクリック計測
export type AffiliateClickParams = {
  productId?: string;
  label: "rakuten" | "amazon" | "yahoo"; // ＝ source
  url?: string; // 遷移先（任意）
  price?: number; // クリック時の表示価格（任意）
};

// 安全に gtag を呼ぶヘルパ
const gtagSafe = (...args: Parameters<GtagFunction>) => {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag(...args);
  }
};

// ページビュー（必要なら呼び出し）
export const pageview = (path: string) => {
  gtagSafe("config", GA_MEASUREMENT_ID, { page_path: path });
};

// クリックイベント（共通でこれを使う）
export const eventAffiliateClick = (p: AffiliateClickParams) => {
  gtagSafe("event", "affiliate_click", {
    source: p.label, // rakuten / amazon / yahoo
    product_id: p.productId ?? "", // 任意
    destination: p.url ?? "", // 任意
    price: typeof p.price === "number" ? p.price : undefined,
    currency: "JPY",
    value: 1,
    event_category: "engagement",
    event_label: p.label,
  });
};
