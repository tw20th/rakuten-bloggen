import * as functions from "firebase-functions";
import { logger } from "firebase-functions";
import { publishScheduler } from "./scheduler/publishScheduler";
import { relatedContentWriter } from "./links/relatedContentWriter";
import { titleAbGenerator } from "./optimize/titleAbGenerator";
import { rotateAbTitle } from "./optimize/rotateAbTitle";

// 🔐 Secret定義
import {
  RAKUTEN_APPLICATION_ID,
  RAKUTEN_AFFILIATE_ID,
  OPENAI_API_KEY,
  SERVICE_ACCOUNT_KEY,
  REVALIDATE_ENDPOINT, // 追加
  REVALIDATE_SECRET,
} from "./config/secrets";

// 🔧 HTTPハンドラー（v1対応済み）
import { fetchRakutenItemsHandler } from "./scripts/fetchRakutenItems";
import { generateBlogFromItemHandler } from "./scripts/generateBlogFromItem";
import { runGenerateSummaryTask } from "./scripts/item/generateSummaryFunction";

// 🕒 スケジュール関数（Cloud Scheduler）
import { runFetchDailyItems } from "./scheduler/fetchDailyItems";
import { runScheduledBlogMorning } from "./scheduler/scheduledBlogMorning";
import { filterAndSaveItems } from "./scripts/item/filterAndSaveItems";

// 🧪 共通で使用する Secret 配列
const commonSecrets = [
  RAKUTEN_APPLICATION_ID,
  RAKUTEN_AFFILIATE_ID,
  OPENAI_API_KEY,
  SERVICE_ACCOUNT_KEY,
  REVALIDATE_ENDPOINT, // 追加
  REVALIDATE_SECRET, // 追加
];

// ✅ fetchRakutenItems：楽天APIから商品取得（HTTP）
export const fetchRakutenItemsFunc = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .https.onRequest(fetchRakutenItemsHandler);

// ✅ generateBlogFromItem：商品からブログ生成（HTTP）
export const generateBlogFromItemFunc = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .https.onRequest(generateBlogFromItemHandler);

// ✅ generateSummaryFromHighlights：要約生成（HTTP）
export const generateSummaryFromHighlightsFunc = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .https.onRequest(async (_req, res) => {
    try {
      await runGenerateSummaryTask();
      res.status(200).send("aiSummary generation completed.");
    } catch (err) {
      logger.error("❌ 要約生成中にエラーが発生しました", err);
      res.status(500).send("Error generating aiSummary.");
    }
  });

// ✅ fetchDailyItems：楽天商品取得（毎日6:00）
export const fetchDailyItems = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("every day 06:00")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await runFetchDailyItems();
  });

// ✅ scheduledBlogMorning：ブログ自動生成（毎日12:00）
export const scheduledBlogMorning = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("every day 12:00")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await runScheduledBlogMorning();
  });

// ✅ scheduledFilterItems：商品加工（毎日6:10）
export const scheduledFilterItems = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("10 6 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    logger.info("⏰ scheduledFilterItems started");

    try {
      await filterAndSaveItems();
      logger.info("✅ filterAndSaveItems completed successfully");
    } catch (error) {
      logger.error("❌ Error in scheduledFilterItems", error);
    }
  });

import { fillMissingAffiliateUrls } from "./scripts/fillMissingAffiliateUrls";

export const fillMissingAffiliateUrlsFunc = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .https.onRequest(async (_req, res) => {
    try {
      await fillMissingAffiliateUrls();
      res.status(200).send("✅ affiliateUrl 補完処理が完了しました");
    } catch (err) {
      logger.error("❌ affiliateUrl 補完処理中にエラーが発生しました", err);
      res.status(500).send("Error filling affiliateUrl");
    }
  });
export { normalizeItems } from "./normalize/normalizeItems";

export const runPublishScheduler = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("every day 12:05")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await publishScheduler(2); // 1日に2本公開（お好みで）
  });

export const runRelatedContentWriter = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("every day 21:00")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await relatedContentWriter(50);
  });

export const runTitleAbGenerator = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("every day 23:00")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await titleAbGenerator(30);
  });

// 毎晩：ローテーション（見出し回転→revalidate）
export const runRotateAbTitle = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .pubsub.schedule("every day 23:05")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await rotateAbTitle(50);
  });

export const manualPublish = functions
  .runWith({ secrets: commonSecrets })
  .region("asia-northeast1")
  .https.onRequest(async (_req, res) => {
    const slugs = await publishScheduler(1);
    res.status(200).send({ ok: true, slugs });
  });
