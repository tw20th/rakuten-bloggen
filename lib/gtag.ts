export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_ID ?? "";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

export const eventAffiliateClick = (params: {
  productId: string;
  label: "rakuten" | "amazon" | "yahoo";
  url: string;
}) => {
  if (!window.gtag) return;
  window.gtag("event", "affiliate_click", {
    event_category: "engagement",
    event_label: `${params.label}:${params.productId}`,
    value: 1,
    outbound: true,
    destination: params.url,
  });
};
