// components/SEO.tsx
type SEOProps = {
  title?: string;
  description?: string;
  url?: string;
  image?: string;
};

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://rakuten-bloggen.vercel.app";
const DEFAULT_TITLE = "モバイルバッテリー比較 | 価格と“ちょうどいい”を毎日更新";
const DEFAULT_DESC =
  "迷うポイントだけ要約。価格・在庫の変動も追跡して最適な1台を見つけます。";

export function SEO({
  title = DEFAULT_TITLE,
  description = DEFAULT_DESC,
  url = SITE,
  image,
}: SEOProps) {
  const ogImage = image ?? `${SITE}/ogp.png`; // 適当なデフォ画像を用意できるとベター
  return (
    <>
      <title>{title}</title>
      <meta name="description" content={description} />
      {/* Open Graph */}
      <meta property="og:type" content="website" />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={url} />
      <meta property="og:image" content={ogImage} />
      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />
      {/* Organization/Website JSON-LD（任意） */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "WebSite",
            name: "Rakuten Bloggen",
            url: SITE,
            potentialAction: {
              "@type": "SearchAction",
              target: `${SITE}/product?query={search_term_string}`,
              "query-input": "required name=search_term_string",
            },
          }),
        }}
      />
    </>
  );
}
