import { onRequest } from "firebase-functions/v2/https";

// 🔧 ハンドラーのインポート
import { fetchRakutenItemsHandler } from "./scripts/fetchRakutenItems";
import { generateBlogFromItemHandler } from "./scripts/generateBlogFromItem";

// 🔐 Secret定義
import { RAKUTEN_APPLICATION_ID, OPENAI_API_KEY } from "./config/secrets";

// ✅ fetchRakutenItemsFunc：楽天APIから商品取得し Firestore に保存
export const fetchRakutenItemsFunc = onRequest(
  {
    region: "asia-northeast1",
    cors: true,
    secrets: [RAKUTEN_APPLICATION_ID],
    invoker: "public", // ←←← これが必要！！
  },
  fetchRakutenItemsHandler,
);

// ✅ generateBlogFromItemFunc：商品データからブログ記事を自動生成
export const generateBlogFromItemFunc = onRequest(
  {
    region: "asia-northeast1",
    cors: true,
    secrets: [OPENAI_API_KEY],
    invoker: "public", // ← こちらにも！
  },
  generateBlogFromItemHandler,
);
