// components/product/AffiliateCTA.tsx
"use client";

type Props = {
  href: string;
  itemId: string;
  itemName: string;
  price?: number;
  label?: string; // ボタン表記
};

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

const getAffiliateSource = (url?: string | null): string | undefined => {
  if (!url) return undefined;
  try {
    const host = new URL(url).hostname;
    if (host.includes("rakuten")) return "rakuten";
    if (host.includes("amazon")) return "amazon";
    if (host.includes("shopping.yahoo")) return "yahoo";
    return host;
  } catch {
    return undefined;
  }
};

export function AffiliateCTA({
  href,
  itemId,
  itemName,
  price,
  label = "最安値を今すぐチェック",
}: Props) {
  const onClick = () => {
    if (typeof window !== "undefined" && typeof window.gtag === "function") {
      window.gtag("event", "affiliate_click", {
        item_id: itemId,
        item_name: itemName,
        price,
        affiliate_source: getAffiliateSource(href),
        value: 1,
      });
    }
  };

  return (
    <a
      href={href}
      target="_blank"
      rel="sponsored nofollow noopener noreferrer"
      onClick={onClick}
      className="inline-block bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
      aria-label={`${label}（外部サイト）`}
    >
      🔗 {label}
    </a>
  );
}
