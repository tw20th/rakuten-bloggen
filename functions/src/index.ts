// functions/src/index.ts
import { onRequest } from "firebase-functions/v2/https";
import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";

// 🔧 ハンドラーのインポート（HTTP 用）
import { fetchRakutenItemsHandler } from "./scripts/fetchRakutenItems";
import { generateBlogFromItemHandler } from "./scripts/generateBlogFromItem";
import { generateSummaryFromHighlights } from "./scripts/item/generateSummaryFunction";

// 🔁 スケジュール関数のインポート（Cloud Scheduler 用）
import { fetchDailyItems } from "./scheduler/fetchDailyItems";
import { scheduledBlogMorning } from "./scheduler/scheduledBlogMorning";

// 🆕 商品加工関数のインポート
import { filterAndSaveItems } from "./scripts/item/filterAndSaveItems";

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

// ✅ generateSummaryFromHighlightsFunc：AI要約生成（HTTP）
export const generateSummaryFromHighlightsFunc = onRequest(
  {
    region: "asia-northeast1",
    cors: true,
    secrets: [OPENAI_API_KEY],
    invoker: "public",
  },
  generateSummaryFromHighlights, // ← ここで関数そのまま渡す
);

// ✅ fetchDailyItems：楽天商品取得（毎日6:00）
export { fetchDailyItems };

// ✅ scheduledBlogMorning：ブログ自動生成（毎日12:00）
export { scheduledBlogMorning };

// ✅ scheduledFilterItems：商品データ加工（毎日6:10）
export const scheduledFilterItems = onSchedule(
  {
    schedule: "10 6 * * *", // JST 6:10
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
  },
  async () => {
    logger.info("⏰ scheduledFilterItems started");

    try {
      await filterAndSaveItems();
      logger.info("✅ filterAndSaveItems completed successfully");
    } catch (error) {
      logger.error("❌ Error in scheduledFilterItems", error);
    }
  },
);
