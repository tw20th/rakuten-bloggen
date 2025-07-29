/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ["thumbnail.image.rakuten.co.jp"],
  },
  productionBrowserSourceMaps: true,
};

export default nextConfig; // ← ✅ これが抜けてた！
