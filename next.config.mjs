/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // ★ remotePatternsを使うことでプロトコル指定やワイルドカードが可能に
    remotePatterns: [
      {
        protocol: "https",
        hostname: "thumbnail.image.rakuten.co.jp",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
      {
        protocol: "https",
        hostname: "shopping.c.yimg.jp", // Yahooショッピング画像CDN
      },
      {
        protocol: "https",
        hostname: "storage.googleapis.com", // GCSバケット (サムネ生成時)
      },
      {
        protocol: "https",
        hostname: "**.googleusercontent.com", // 署名付きURL想定
      },
    ],
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig;
