import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { OPENAI_API_KEY } from "../config/secrets";
import { runGenerateSummaryTask } from "../scripts/item/generateSummaryFunction"; // ← 変更！

export const scheduledGenerateSummary = onSchedule(
  {
    schedule: "0 1 * * *", // JST 1:00
    timeZone: "Asia/Tokyo",
    region: "asia-northeast1",
    secrets: [OPENAI_API_KEY],
  },
  async () => {
    logger.info("⏰ scheduledGenerateSummary started");
    try {
      await runGenerateSummaryTask(); // ← 修正ポイント！
      logger.info("✅ scheduledGenerateSummary completed");
    } catch (error) {
      logger.error("❌ Error in scheduledGenerateSummary", error);
    }
  },
);
