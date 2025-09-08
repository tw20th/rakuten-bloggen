// functions/src/scripts/item/scheduledFilterItems.ts
import * as functions from "firebase-functions";
import { filterAndSaveItems } from "./filterAndSaveItems";

export const scheduledFilterItems = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" }) // 余裕を持たせる
  .region("asia-northeast1")
  .pubsub.schedule("10 6 * * *") // 毎日6:10 JST
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    functions.logger.info("⏰ scheduledFilterItems started");
    await filterAndSaveItems();
    functions.logger.info("✅ filterAndSaveItems completed");
  });
