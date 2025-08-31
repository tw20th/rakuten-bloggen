import * as functions from "firebase-functions";
import { runDataQualitySweep } from "../scripts/audit/runDataQualitySweep";

export const runDataQuality = functions
  .region("asia-northeast1") // ★ リージョンを明示
  .https.onRequest(async (_req, res) => {
    try {
      await runDataQualitySweep();
      res.status(200).send("ok");
    } catch (e) {
      res.status(500).send((e as Error).message);
    }
  });
