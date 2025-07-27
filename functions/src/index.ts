import { onRequest } from "firebase-functions/v2/https";

// 🔧 ハンドラーのインポート（HTTP 用）
import { fetchRakutenItemsHandler } from "./scripts/fetchRakutenItems";
import { generateBlogFromItemHandler } from "./scripts/generateBlogFromItem";

// 🔁 スケジュール関数のインポート（Cloud Scheduler 用）
import { fetchDailyItems } from "./scheduler/fetchDailyItems";
import { scheduledBlogMorning } from "./scheduler/scheduledBlogMorning";

// 🔐 Secret定義
import { RAKUTEN_APPLICATION_ID, OPENAI_API_KEY } from "./config/secrets";

// ✅ fetchRakutenItemsFunc：楽天APIから商品取得（HTTP）
export const fetchRakutenItemsFunc = onRequest(
  {
    region: "asia-northeast1",
    cors: true,
    secrets: [RAKUTEN_APPLICATION_ID],
    invoker: "public",
  },
  fetchRakutenItemsHandler,
);

// ✅ generateBlogFromItemFunc：商品からブログ生成（HTTP）
export const generateBlogFromItemFunc = onRequest(
  {
    region: "asia-northeast1",
    cors: true,
    secrets: [OPENAI_API_KEY],
    invoker: "public",
  },
  generateBlogFromItemHandler,
);

// ✅ fetchDailyItems：楽天商品取得（毎日6:00）
export { fetchDailyItems };

// ✅ scheduledBlogMorning：ブログ自動生成（毎日12:00）
export { scheduledBlogMorning };
