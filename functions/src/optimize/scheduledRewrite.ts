// functions/src/optimize/scheduledRewrite.ts
import * as functions from "firebase-functions";
import { generateRewrite } from "./generateRewrite";

export const scheduledRewriteLowScore = functions
  .runWith({ timeoutSeconds: 540, memory: "512MB" })
  .region("asia-northeast1")
  .pubsub.schedule("10 23 * * *") // 23:10 JST
  .timeZone("Asia/Tokyo")
  .onRun(async () => {
    await generateRewrite({ max: 3 });
  });
