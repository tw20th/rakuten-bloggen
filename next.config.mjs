// next.config.mjs
const nextConfig = {
  images: {
    domains: [
      "thumbnail.image.rakuten.co.jp",
      "images.unsplash.com",
      "m.media-amazon.com",
      "shopping.c.yimg.jp", // Yahooショッピング画像CDN
    ],
  },
  productionBrowserSourceMaps: true,
};
export default nextConfig;
