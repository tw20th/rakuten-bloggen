import { onSchedule } from "firebase-functions/v2/scheduler";
import { logger } from "firebase-functions";
import { filterAndSaveItems } from "./filterAndSaveItems";

export const scheduledFilterItems = onSchedule(
  {
    schedule: "10 6 * * *", // 毎日6:10に実行（東京時間）
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
