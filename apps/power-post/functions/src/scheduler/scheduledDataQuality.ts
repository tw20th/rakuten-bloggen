import * as functions from "firebase-functions";
import { runDataQualitySweep } from "../scripts/audit/runDataQualitySweep";

export const scheduledDataQuality = functions
  .region("asia-northeast1")
  .pubsub.schedule("15 23 * * *")
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await runDataQualitySweep();
  });
