// functions/src/scheduler/scheduledGenerateSummary.ts

import * as functions from "firebase-functions";
import { runGenerateSummaryTask } from "../scripts/item/generateSummaryFunction";
import { config } from "dotenv";

// .env 読み込み（必要であれば）
config();

export const scheduledGenerateSummary = functions
  .region("asia-northeast1")
  .pubsub.schedule("0 1 * * *") // JST 1:00
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    functions.logger.info("⏰ scheduledGenerateSummary started");

    try {
      await runGenerateSummaryTask();
      functions.logger.info("✅ scheduledGenerateSummary completed");
    } catch (error) {
      functions.logger.error("❌ Error in scheduledGenerateSummary", error);
    }
  });
