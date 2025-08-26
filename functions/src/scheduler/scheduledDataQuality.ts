import * as functions from "firebase-functions";
import { runDataQualitySweep } from "../scripts/audit/runDataQualitySweep";

export const scheduledDataQuality = functions.pubsub
  .schedule("15 23 * * *") // JST 23:15 (asia-northeast1)
  .timeZone("Asia/Tokyo")
  .onRun(async () => runDataQualitySweep());
