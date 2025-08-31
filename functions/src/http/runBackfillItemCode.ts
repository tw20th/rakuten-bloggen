import * as functions from "firebase-functions";
import { backfillItemCode } from "../scripts/normalize/backfillItemCode";

export const runBackfillItemCode = functions
  .region("asia-northeast1") // ★ リージョンを明示
  .https.onRequest(async (_req, res) => {
    try {
      const result = await backfillItemCode();
      res.json(result);
    } catch (e) {
      res.status(500).json({ error: (e as Error).message });
    }
  });
